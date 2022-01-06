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
import { metricSort } from "../metrics/metrics";
import { overlapFeatures } from "../metrics/overlapFeaturesNext";
import { ExtendedSketchMetric } from "../metrics/types";
import config, { MetricResult } from "../_config";

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

const CONFIG = config.existingProtection;
const REPORT_ID = "existingProtections";
const METRIC_ID = "areaOverlap";

export async function existingProtections(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<MetricResult> {
  const sketches = toSketchArray(sketch);
  const box = sketch.bbox || bbox(sketch);
  const features = await fgbFetchAll<ExistingProtectionFeature>(
    `${config.dataBucketUrl}${CONFIG.filename}`,
    box
  );

  const metrics: ExtendedSketchMetric[] = (
    await Promise.all(
      CONFIG.classes.map(async (curClass) => {
        // Filter out single class, exclude null geometry too
        const classFeatures = features.filter((feat) => {
          return (
            feat.geometry && feat.properties[classProperty] === curClass.classId
          );
        }, []);
        const overlapResult = await overlapFeatures(
          METRIC_ID,
          classFeatures,
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

export default new GeoprocessingHandler(existingProtections, {
  title: "existingProtections",
  description: "Find which legislated areas the sketch overlaps with",
  timeout: 180, // seconds
  executionMode: "async",
  memory: 4096,
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
});
