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
import config, { HabitatRestoreResults } from "../_config";
import { ClassMetricsSketch } from "../util/types";

import { overlapStatsVector } from "../util/sumOverlapVector";
import habitatRestoreTotals from "../../data/precalc/habitatRestoreTotals.json";
const precalcTotals = habitatRestoreTotals as HabitatRestoreResults;

const LAYERS = config.habitatRestore.layers;

export async function habitatRestore(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<HabitatRestoreResults> {
  const sketches = toSketchArray(sketch);
  const box = sketch.bbox || bbox(sketch);

  const classMetrics = (
    await Promise.all(
      LAYERS.map(async (lyr) => {
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

  return {
    byClass: classMetrics,
  };
}

export default new GeoprocessingHandler(habitatRestore, {
  title: "habitatRestore",
  description: "habitat restoration area within sketch",
  timeout: 120, // seconds
  executionMode: "async",
  memory: 4096,
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
});
