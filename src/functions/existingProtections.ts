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
import { overlapFeatures } from "../metrics/overlapFeatures";
import { ClassMetricsSketch } from "../metrics/types";
import config, {
  ExistingProtectionBaseResults,
  ExistingProtectionResults,
} from "../_config";
import legislatedAreaTotals from "../../data/precalc/existingProtectionsTotals.json";

// Multi-class vector dataset
export type ExistingProtectionProperties = {
  ["Name"]: string;
  ["Type"]: string;
};
export type ExistingProtectionFeature = Feature<
  Polygon,
  ExistingProtectionProperties
>;

const precalcTotals = legislatedAreaTotals as ExistingProtectionBaseResults;
const CONFIG = config.existingProtection;

export async function existingProtections(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<ExistingProtectionResults> {
  const sketches = toSketchArray(sketch);
  const box = sketch.bbox || bbox(sketch);
  const features = await fgbFetchAll<ExistingProtectionFeature>(
    `${config.dataBucketUrl}${CONFIG.filename}`,
    box
  );

  const classMetrics = (
    await Promise.all(
      CONFIG.classes.map(async (curClass) => {
        // Filter out single class, exclude null geometry too
        const classFeatures = features.filter(
          (feat: any) =>
            feat.geometry &&
            feat.properties[config.existingProtection.classProperty] ===
              curClass.name,
          []
        );
        return overlapFeatures(
          classFeatures,
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

  return {
    byClass: classMetrics,
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
