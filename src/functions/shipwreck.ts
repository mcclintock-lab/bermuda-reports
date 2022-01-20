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
import { metricRekey, metricSort } from "../metrics/metrics";
import { overlapFeatures } from "../metrics/overlapFeatures";
import { Metric } from "../metrics/types";
import config, { ReportResult } from "../_config";

export const shipwreckSumProperty = "NumberOfRe";
export type ShipwreckProperties = {
  [shipwreckSumProperty]: string;
};
export type ShipwreckFeature = Feature<Polygon, ShipwreckProperties>;

const METRIC_ID = "sumOverlap";
const CONFIG = config;
const REPORT = CONFIG.shipwreck;
const METRIC = REPORT.metrics[METRIC_ID];

export async function existingProtections(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<ReportResult> {
  const box = sketch.bbox || bbox(sketch);
  const features = await fgbFetchAll<ShipwreckFeature>(
    `${config.dataBucketUrl}${METRIC.filename}`,
    box
  );

  const metrics: Metric[] = (
    await Promise.all(
      METRIC.classes.map(async (curClass) => {
        const overlapResult = await overlapFeatures(
          METRIC.metricId,
          features,
          sketch,
          {
            operation: "sum",
            sumProperty: shipwreckSumProperty,
            calcSketchMetrics: true,
          }
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

export default new GeoprocessingHandler(existingProtections, {
  title: "shipwreck",
  description: "Find number of shipwrecks within sketch",
  timeout: 120, // seconds
  executionMode: "async",
  memory: 4096,
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
});
