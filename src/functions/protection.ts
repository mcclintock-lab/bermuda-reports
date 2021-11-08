import {
  Sketch,
  SketchCollection,
  Polygon,
  GeoprocessingHandler,
  toSketchArray,
  getUserAttribute,
  groupBy,
  keyBy,
  genSampleSketchCollection,
  getJsonUserAttribute,
} from "@seasketch/geoprocessing";
import { featureCollection } from "@turf/helpers";
import { areaStats } from "../util/areaStats";
import { STUDY_REGION_AREA_SQ_METERS } from "../_config";
import {
  getCategoryForActivities,
  iucnCategories,
  levels,
} from "../util/iucnProtectionLevel";

const linearUnits = "feet";
const areaUnits = "square feet";

export interface SketchStat {
  sketchId: string;
  name: string;
  // category stats
  category: string;
  level: string;
  // area stats
  area: number;
  percPlanningArea: number;
}

export interface CategoryStat {
  category: string;
  level: string;
  numSketches: number;
  area: number;
  percPlanningArea: number;
}

export interface LevelStat {
  level: string;
  numSketches: number;
  area: number;
  percPlanningArea: number;
}

export interface ProtectionResult {
  sketchStats: SketchStat[];
  categoryStats: CategoryStat[];
  levelStats: LevelStat[];
}

export async function protection(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<ProtectionResult> {
  const sketches = toSketchArray(sketch);
  const sketchMap = keyBy(sketches, (item) => item.properties.id);

  // TODO: convert to square meters
  const planningAreaStats = await areaStats(
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
      area: planningAreaStats.sketchAreas[index].area,
      percPlanningArea: planningAreaStats.sketchAreas[index].percArea,
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
      // Dissolve by category to get true area and %
      const sc = genSampleSketchCollection(featureCollection(catSketches));
      const catAreaStats = await areaStats(
        sc as SketchCollection<Polygon>,
        STUDY_REGION_AREA_SQ_METERS
      );

      return {
        category: categoryName,
        level: iucnCategories[categoryName].level,
        numSketches: catGroups[categoryName].length,
        area: catAreaStats.area,
        percPlanningArea: catAreaStats.percArea,
      };
    })
  );

  // rollup to level stats
  const levelGroups = groupBy(sketchStats, (item) => item.level);
  const levelStats: LevelStat[] = await Promise.all(
    levels.map(async (levelName) => {
      const levelSketchStats = levelGroups[levelName];

      if (!levelSketchStats)
        return {
          level: levelName,
          numSketches: 0,
          area: 0,
          percPlanningArea: 0,
        };

      const levelSketches = levelSketchStats.map(
        (stat) => sketchMap[stat.sketchId]
      );
      // Dissolve by category to get true area and %
      const sl = genSampleSketchCollection(featureCollection(levelSketches));
      const levelAreaStats = await areaStats(
        sl as SketchCollection<Polygon>,
        STUDY_REGION_AREA_SQ_METERS
      );

      return {
        level: levelName,
        numSketches: levelGroups[levelName].length,
        area: levelAreaStats.area,
        percPlanningArea: levelAreaStats.percArea,
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
  timeout: 10, // seconds
  executionMode: "sync",
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
});
