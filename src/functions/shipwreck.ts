import {
  Sketch,
  SketchCollection,
  GeoprocessingHandler,
  Feature,
  Polygon,
  Metric,
  toNullSketch,
  rekeyMetrics,
  sortMetrics,
  ReportResult,
} from "@seasketch/geoprocessing";
import { fgbFetchAll } from "@seasketch/geoprocessing/dataproviders";
import bbox from "@turf/bbox";
import config from "../_config";
import { overlapFeatures } from "../util/overlapFeatures";

export const shipwreckSumProperty = "NumberOfRe";
export type ShipwreckProperties = {
  [shipwreckSumProperty]: string;
};
export type ShipwreckFeature = Feature<Polygon, ShipwreckProperties>;

const METRIC_ID = "valueOverlap";
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
    metrics: sortMetrics(rekeyMetrics(metrics)),
    sketch: toNullSketch(sketch, true),
  };
}

export default new GeoprocessingHandler(existingProtections, {
  title: "shipwreck",
  description: "Find number of shipwrecks within sketch",
  timeout: 900, // seconds
  executionMode: "async",
  memory: 4096,
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
});
