import {
  Sketch,
  SketchCollection,
  GeoprocessingHandler,
  Feature,
  Polygon,
  fgbFetchAll,
  toSketchArray,
} from "@seasketch/geoprocessing";
import bbox from "@turf/bbox";
import config, {
  HabitatNurseryResults,
  HabitatNurseryLevelResults,
} from "../_config";
import { levels } from "../util/iucnProtectionLevel";
import { getCategoryNameForSketches } from "../util/iucnHelpers";
import { ClassMetricsSketch } from "../util/types";

import { overlapStatsVector } from "../util/sumOverlapVector";
import { getGroupMetrics } from "../util/metrics";

import habitatNurseryTotals from "../../data/precalc/habitatNurseryTotals.json";
const precalcTotals = habitatNurseryTotals as HabitatNurseryResults;

export async function habitatNursery(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<HabitatNurseryLevelResults> {
  const sketches = toSketchArray(sketch);
  const box = sketch.bbox || bbox(sketch);

  const classMetrics = (
    await Promise.all(
      config.habitatNursery.layers.map(async (lyr) => {
        const features = await fgbFetchAll<Feature<Polygon>>(
          `${config.dataBucketUrl}${lyr.filename}`,
          box
        );
        return overlapStatsVector(
          features,
          lyr.baseFilename,
          sketches,
          precalcTotals.byClass[lyr.baseFilename].value
        );
      })
    )
  ).reduce<ClassMetricsSketch>((metricsSoFar, metric) => {
    return {
      ...metricsSoFar,
      [metric.name]: metric,
    };
  }, {});

  const sketchCategoryMap = getCategoryNameForSketches(sketches);
  const levelMetrics = getGroupMetrics(
    levels,
    sketchCategoryMap,
    classMetrics,
    precalcTotals.overall.value
  );

  return {
    overall: precalcTotals.overall,
    byClass: classMetrics,
    byLevel: levelMetrics,
  };
}

export default new GeoprocessingHandler(habitatNursery, {
  title: "habitatNursery",
  description: "key nursery habitat within sketch",
  timeout: 120, // seconds
  executionMode: "async",
  memory: 4096,
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
});
