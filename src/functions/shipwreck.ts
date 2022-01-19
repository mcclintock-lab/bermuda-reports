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
import { metricSort } from "../metrics/metrics";
import { overlapFeatures } from "../metrics/overlapFeatures";
import { ReportSketchMetric } from "../metrics/types";
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

  const metrics: ReportSketchMetric[] = (
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
          (metric): ReportSketchMetric => ({
            reportId: REPORT.reportId,
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

export default new GeoprocessingHandler(existingProtections, {
  title: "shipwreck",
  description: "Find number of shipwrecks within sketch",
  timeout: 10, // seconds
  executionMode: "sync",
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
});
