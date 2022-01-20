import {
  Sketch,
  SketchCollection,
  GeoprocessingHandler,
  Feature,
  Polygon,
  fgbFetchAll,
  toNullSketch,
} from "@seasketch/geoprocessing";
import bbox from "@turf/bbox";
import config, { ReportResult } from "../_config";
import { Metric } from "../metrics/types";
import { overlapFeatures } from "../metrics/overlapFeatures";
import { metricRekey, metricSort } from "../metrics/metrics";

const CONFIG = config.habitatRestore;
const REPORT_ID = "existingProtections";
const METRIC_ID = "areaOverlap";

export async function habitatRestore(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<ReportResult> {
  const box = sketch.bbox || bbox(sketch);

  const metrics = (
    await Promise.all(
      CONFIG.classes.map(async (curClass) => {
        const features = await fgbFetchAll<Feature<Polygon>>(
          `${config.dataBucketUrl}${curClass.filename}`,
          box
        );
        const overlapResult = await overlapFeatures(
          METRIC_ID,
          features,
          sketch
        );
        // Transform from simple to extended metric
        return overlapResult.map(
          (metric): Metric => ({
            ...metric,
            classId: curClass.classId,
          })
        );
      })
    )
  ).reduce(
    // merge
    (metricsSoFar, curClassMetrics) => [...metricsSoFar, ...curClassMetrics],
    []
  );

  return {
    metrics: metricSort(metricRekey(metrics)),
    sketch: toNullSketch(sketch, true),
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
