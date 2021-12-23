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
  HabitatRestoreBaseResults,
  HabitatRestoreResults,
} from "../_config";
import { ClassMetricsSketch } from "../metrics/types";

import { overlapFeatures } from "../metrics/overlapFeatures";
import habitatRestoreTotals from "../../data/precalc/habitatRestoreTotals.json";

const precalcTotals = habitatRestoreTotals as HabitatRestoreBaseResults;
const CLASSES = config.habitatRestore.classes;

export async function habitatRestore(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<HabitatRestoreResults> {
  const sketches = toSketchArray(sketch);
  const box = sketch.bbox || bbox(sketch);

  const classMetrics = (
    await Promise.all(
      CLASSES.map(async (curClass) => {
        const features = await fgbFetchAll<Feature<Polygon>>(
          `${config.dataBucketUrl}${curClass.filename}`,
          box
        );
        return overlapFeatures(
          features,
          curClass.classId,
          sketches,
          precalcTotals.byClass[curClass.classId].value
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
