import {
  Sketch,
  SketchCollection,
  Polygon,
  Feature,
  GeoprocessingHandler,
  fgbFetchAll,
  toSketchArray,
  keyBy,
} from "@seasketch/geoprocessing";
import { getJsonUserAttribute } from "../util/getJsonUserAttribute";
import bbox from "@turf/bbox";
import config, {
  EdgeGroupMetricsSketch,
  EdgeSketchMetric,
  PlatformEdgeResult,
} from "../_config";
import { overlapFeatures } from "../metrics/overlapFeatures";
import { getGroupMetrics } from "../metrics/metrics";
import { getBreakGroup } from "../util/getBreakGroup";
import platformEdgeTotals from "../../data/precalc/platformEdgeTotals.json";

const precalcTotals = platformEdgeTotals as Record<string, number>;
const CONFIG = config.platformEdge;
const CLASS = CONFIG.classes[0];

export async function platformEdge(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<PlatformEdgeResult> {
  const sketches = toSketchArray(sketch);
  const box = sketch.bbox || bbox(sketch);

  const edgeMultiPoly = await fgbFetchAll<Feature<Polygon>>(
    `${config.dataBucketUrl}${CLASS.filename}`,
    box
  );

  const classMetric = await overlapFeatures(
    edgeMultiPoly,
    CLASS.classId,
    sketches,
    precalcTotals[CLASS.classId]
  );

  // Sketch metrics
  const sketchMetricsById = keyBy(classMetric.sketchMetrics, (item) => item.id);
  const edgeSketchMetrics = sketches.map((sketch) => {
    const sketchActivities: string[] = getJsonUserAttribute(
      sketch,
      "ACTIVITIES",
      []
    );
    const numFishingActivities = CONFIG.fishingActivities.reduce(
      (hasFishingSoFar, fishingActivity) =>
        sketchActivities.includes(fishingActivity)
          ? hasFishingSoFar + 1
          : hasFishingSoFar,
      0
    );

    const curSketchMetric = sketchMetricsById[sketch.properties.id];

    return {
      ...curSketchMetric,
      numFishingRestricted:
        CONFIG.fishingActivities.length - numFishingActivities,
      overlap:
        curSketchMetric.value > 0 &&
        numFishingActivities < CONFIG.fishingActivities.length,
    };
  });

  // Class metrics
  const edgeClassMetric = {
    ...classMetric,
    sketchMetrics: edgeSketchMetrics,
  };
  const edgeClassMetrics = { [edgeClassMetric.name]: edgeClassMetric };

  // Edge group metrics

  // Match sketch to first break group where it has at least min number of restricted activities
  // If no overlap then it's always no break
  // Return true if matches current group
  const sketchMetricsFilter = (
    sketchMetric: EdgeSketchMetric,
    curGroup: string
  ) =>
    curGroup ===
    getBreakGroup(
      CONFIG.breakMap,
      sketchMetric.numFishingRestricted,
      sketchMetric.overlap
    );

  let edgeGroupMetrics = getGroupMetrics(
    Object.keys(CONFIG.breakMap),
    sketches,
    sketchMetricsFilter,
    edgeClassMetrics,
    { [CLASS.classId]: { value: precalcTotals[CLASS.classId] } },
    { [CLASS.classId]: edgeMultiPoly }
  );

  return {
    byClass: edgeClassMetrics,
    byGroup: edgeGroupMetrics as EdgeGroupMetricsSketch,
  };
}

export default new GeoprocessingHandler(platformEdge, {
  title: "platformEdge",
  description: "Calculates area stats",
  timeout: 30, // seconds
  executionMode: "async",
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
});
