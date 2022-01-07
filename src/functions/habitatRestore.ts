import {
  Sketch,
  SketchCollection,
  GeoprocessingHandler,
  Feature,
  Polygon,
  fgbFetchAll,
  toSketchArray,
  toNullSketch,
} from "@seasketch/geoprocessing";
import bbox from "@turf/bbox";
import config, { MetricResult } from "../_config";
import { ExtendedSketchMetric } from "../metrics/types";
import { overlapFeatures } from "../metrics/overlapFeaturesNext";
import { metricSort } from "../metrics/metrics";

const CONFIG = config.habitatRestore;
const REPORT_ID = "existingProtections";
const METRIC_ID = "areaOverlap";

export async function habitatRestore(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<MetricResult> {
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
          (metric): ExtendedSketchMetric => ({
            reportId: REPORT_ID,
            classId: curClass.classId,
            ...metric,
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
    metrics: metricSort(metrics),
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
