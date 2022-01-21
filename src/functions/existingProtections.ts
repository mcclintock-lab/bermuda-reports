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

// Multi-class vector dataset
export const nameProperty = "Name";
export const classProperty = "Type";
export type ExistingProtectionProperties = {
  [nameProperty]: string;
  [classProperty]: string;
};
export type ExistingProtectionFeature = Feature<
  Polygon,
  ExistingProtectionProperties
>;

const REPORT = config.existingProtection;
const METRIC = REPORT.metrics.areaOverlap;

export async function existingProtections(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<ReportResult> {
  const box = sketch.bbox || bbox(sketch);
  const features = await fgbFetchAll<ExistingProtectionFeature>(
    `${config.dataBucketUrl}${METRIC.filename}`,
    box
  );

  const metrics: Metric[] = (
    await Promise.all(
      METRIC.classes.map(async (curClass) => {
        // Filter out single class, exclude null geometry too
        const classFeatures = features.filter((feat) => {
          return (
            feat.geometry && feat.properties[classProperty] === curClass.classId
          );
        }, []);
        const overlapResult = await overlapFeatures(
          METRIC.metricId,
          classFeatures,
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

export default new GeoprocessingHandler(existingProtections, {
  title: "existingProtections",
  description: "Find which legislated areas the sketch overlaps with",
  timeout: 180, // seconds
  executionMode: "async",
  memory: 4096,
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
});
