import {
  Sketch,
  SketchCollection,
  GeoprocessingHandler,
  sketchArea,
  Feature,
  Polygon,
  isFeatureCollection,
  fgbFetchAll,
  groupBy,
} from "@seasketch/geoprocessing";
import bbox from "@turf/bbox";
import { featureCollection } from "@turf/helpers";
import config, {
  HabitatNurseryResults,
  HabitatNurseryLevelResults,
} from "../_config";
import { getJsonUserAttribute } from "../util/getJsonUserAttribute";
import {
  getCategoryForActivities,
  IucnCategoryCombined,
  levels,
} from "../util/iucnProtectionLevel";
import { ClassMetricsSketch, GroupMetricsSketch } from "../util/types";

import habitatNurseryTotals from "../../data/precalc/habitatNurseryTotals.json";
const precalcTotals = habitatNurseryTotals as HabitatNurseryResults;

export async function habitatNursery(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<HabitatNurseryLevelResults> {
  const sketchColl = isFeatureCollection(sketch)
    ? sketch
    : featureCollection([sketch]);
  const box = sketch.bbox || bbox(sketch);

  // const nurseryFeatures = await Promise.all(
  //   config.habitatNursery.layers.map((lyr) => {
  //     return fgbFetchAll<Feature<Polygon | LineString | Point>>(
  //       `${config.dataBucketUrl}${lyr.filename}`,
  //       box
  //     );
  //   })
  // );

  const classMetrics: ClassMetricsSketch = config.habitatNursery.layers.reduce(
    (acc, lyr) => {
      const lyrValue = 30;
      return {
        ...acc,
        [lyr.baseFilename]: {
          name: lyr.baseFilename,
          value: lyrValue,
          percValue: lyrValue / precalcTotals.byClass[lyr.baseFilename].value,
          sketchMetrics: sketchColl.features.map((sk) => {
            const sketchValue = 13;
            return {
              id: sk.properties.id,
              name: sk.properties.name,
              value: sketchValue,
              percValue:
                sketchValue / precalcTotals.byClass[lyr.baseFilename].value,
            };
          }),
        },
      };
    },
    {}
  );

  const sketchCategoryMap = sketchColl.features.reduce<
    Record<string, IucnCategoryCombined>
  >((acc, sketch) => {
    // Get sketch allowed activities, then category
    const activities: string[] = getJsonUserAttribute(sketch, "ACTIVITIES", []);
    const category = getCategoryForActivities(activities);
    return {
      ...acc,
      [sketch.properties.id]: category,
    };
  }, {});

  // For each level
  const levelMetrics = levels.reduce<GroupMetricsSketch>((acc, curLevel) => {
    // For each class metric, get sketch metrics for just this level
    const newBaseMetrics = Object.keys(classMetrics).reduce(
      (acc, curClassMetricName) => {
        const curClassMetric = classMetrics[curClassMetricName];
        const levelSketchMetrics = curClassMetric.sketchMetrics.filter(
          (sketchMetric) =>
            sketchCategoryMap[sketchMetric.id].level === curLevel
        );

        // If no sketch metrics found for this level, return empty
        if (levelSketchMetrics.length === 0) {
          return {
            ...acc,
            [curClassMetricName]: {
              value: 0,
              percValue: 0,
              sketchMetrics: [],
            },
          };
        }

        // Calc the overall stats for this level
        const levelValue = levelSketchMetrics.reduce(
          (sumSoFar, sm) => sm.value + sumSoFar,
          0
        );
        const levelPercValue = levelValue / precalcTotals.overall.value;

        return {
          ...acc,
          [curClassMetricName]: {
            value: levelValue,
            percValue: levelPercValue,
            sketchMetrics: levelSketchMetrics,
          },
        };
      },
      {}
    );

    return {
      ...acc,
      [curLevel]: newBaseMetrics,
    };
  }, {});

  return {
    overall: precalcTotals.overall,
    byClass: classMetrics,
    byLevel: levelMetrics,
  };
}

export default new GeoprocessingHandler(habitatNursery, {
  title: "habitatNursery",
  description: "key nursery habitat within sketch",
  timeout: 60, // seconds
  executionMode: "async",
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
});
