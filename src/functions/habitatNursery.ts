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
import { getLevelNameForSketches } from "../util/iucnHelpers";
import { ClassMetricsSketch, SketchMetric } from "../metrics/types";

import { overlapFeatures } from "../metrics/overlapFeatures";
import { getGroupMetrics } from "../metrics/metrics";

import habitatNurseryTotals from "../../data/precalc/habitatNurseryTotals.json";

const precalcTotals = habitatNurseryTotals as HabitatNurseryResults;
const CONFIG = config.habitatNursery;

export async function habitatNursery(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<HabitatNurseryLevelResults> {
  const sketches = toSketchArray(sketch);
  const box = sketch.bbox || bbox(sketch);

  // Class metrics
  const featuresByClass: Record<string, Feature<Polygon>[]> = {};
  const classMetrics = (
    await Promise.all(
      CONFIG.classes.map(async (curClass) => {
        featuresByClass[curClass.name] = await fgbFetchAll(
          `${config.dataBucketUrl}${curClass.filename}`,
          box
        );
        return overlapFeatures(
          featuresByClass[curClass.name],
          curClass.name,
          sketches,
          precalcTotals.byClass[curClass.name].value
        );
      })
    )
  ).reduce<ClassMetricsSketch>((metricsSoFar, metric) => {
    return {
      ...metricsSoFar,
      [metric.name]: metric,
    };
  }, {});

  // Level metrics
  const sketchCategoryMap = getLevelNameForSketches(sketches);
  const sketchMetricsFilter = (sketchMetric: SketchMetric, curGroup: string) =>
    sketchCategoryMap[sketchMetric.id] === curGroup;

  const levelMetrics = getGroupMetrics(
    levels,
    sketches,
    sketchMetricsFilter,
    classMetrics,
    precalcTotals.byClass,
    featuresByClass
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
  timeout: 180, // seconds
  executionMode: "async",
  memory: 8192,
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
});
