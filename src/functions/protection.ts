import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
  Feature,
  GeoprocessingHandler,
  toSketchArray,
  groupBy,
  keyBy,
  genSampleSketchCollection,
  getJsonUserAttribute,
  difference,
} from "@seasketch/geoprocessing";
import { featureCollection } from "@turf/helpers";
import flatten from "@turf/flatten";
import { overlapArea } from "../metrics/overlapArea";
import { STUDY_REGION_AREA_SQ_METERS, ProtectionResult } from "../_config";
import { SketchStat, CategoryStat, LevelStat } from "../metrics/types";
import {
  getCategoryForActivities,
  iucnCategories,
  levels,
} from "../util/iucnProtectionLevel";

export async function protection(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<ProtectionResult> {
  const sketches = toSketchArray(sketch);
  const sketchMap = keyBy(sketches, (item) => item.properties.id);

  const planningAreaStats = await overlapArea(
    "eez",
    sketch,
    STUDY_REGION_AREA_SQ_METERS
  );

  const sketchStats: SketchStat[] = sketches.map((s, index) => {
    // Get sketch allowed activities, then category
    const activities: string[] = getJsonUserAttribute(s, "ACTIVITIES", []);
    const category = getCategoryForActivities(activities);
    const level = category.level;

    return {
      sketchId: s.properties.id,
      name: s.properties.name,
      category: category.category,
      level,
      area: planningAreaStats.sketchMetrics[index].value,
      percPlanningArea: planningAreaStats.sketchMetrics[index].percValue,
    };
  });

  // Rollup to category stats
  const catGroups = groupBy(sketchStats, (item) => item.category);
  const categoryStats: CategoryStat[] = await Promise.all(
    Object.keys(catGroups).map(async (categoryName) => {
      const catSketchStats = catGroups[categoryName];
      const catSketches = catSketchStats.map(
        (stat) => sketchMap[stat.sketchId]
      );
      // Calc area stats for each category, accounting for overlap, to get true area and %
      const sc = genSampleSketchCollection(featureCollection(catSketches));
      const catAreaStats = await overlapArea(
        "eez",
        sc as SketchCollection<Polygon>,
        STUDY_REGION_AREA_SQ_METERS
      );

      return {
        category: categoryName,
        level: iucnCategories[categoryName].level,
        numSketches: catGroups[categoryName].length,
        area: catAreaStats.value,
        percPlanningArea: catAreaStats.percValue,
      };
    })
  );

  // rollup to level stats
  const levelGroups = groupBy(sketchStats, (item) => item.level);
  const levelStats: LevelStat[] = await Promise.all(
    levels.map(async (levelName, levelIndex) => {
      const levelSketchStats = levelGroups[levelName];

      if (!levelSketchStats) {
        return {
          level: levelName,
          numSketches: 0,
          area: 0,
          percPlanningArea: 0,
        };
      }

      const levelSketches = levelSketchStats.map(
        (stat) => sketchMap[stat.sketchId]
      );

      // Remove overlap with higher level sketch stats (which trump current level)
      const otherLevelSketchStats = Object.keys(levelGroups).reduce<
        SketchStat[]
      >((otherSketchStats, otherName) => {
        // Append other stats if higher level (lower index)
        const otherIndex = levels.findIndex((level) => otherName === level);
        return otherSketchStats.concat(
          otherIndex < levelIndex ? levelGroups[otherName] : otherSketchStats
        );
      }, []);
      const otherLevelSketches = otherLevelSketchStats.map(
        (stat) => sketchMap[stat.sketchId]
      );
      const nonOverlap = levelSketches
        .map((levelSketch) => difference(levelSketch, otherLevelSketches))
        .reduce<Feature<Polygon | MultiPolygon>[]>(
          (rem, diff) => (diff ? rem.concat(diff) : rem),
          []
        );
      const remFeatures =
        otherLevelSketches.length > 0 ? nonOverlap : levelSketches;

      // Calc area stats for each level, accounting for overlap, to get true area and %
      const sl = genSampleSketchCollection(
        flatten(featureCollection(remFeatures))
      );
      const levelAreaStats = await overlapArea(
        "eez",
        sl,
        STUDY_REGION_AREA_SQ_METERS
      );

      return {
        level: levelName,
        numSketches: levelGroups[levelName].length,
        area: levelAreaStats.value,
        percPlanningArea: levelAreaStats.percValue,
      };
    })
  );

  return {
    sketchStats,
    categoryStats,
    levelStats,
  };
}

export default new GeoprocessingHandler(protection, {
  title: "protection",
  description: "Calculates IUCN protection levels",
  timeout: 120, // seconds
  executionMode: "async",
  memory: 4096,
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
});
