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

const CLASS = config.platformEdge.layers[0];
const ACTIVITIES = config.platformEdge.fishingActivities;
const BREAK_MAP = config.platformEdge.breakMap;

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
    CLASS.baseFilename,
    sketches,
    CLASS.totalArea
  );

  // Sketch metrics
  const sketchMetricsById = keyBy(classMetric.sketchMetrics, (item) => item.id);
  const edgeSketchMetrics = sketches.map((sketch) => {
    const sketchActivities: string[] = getJsonUserAttribute(
      sketch,
      "ACTIVITIES",
      []
    );
    const numFishingActivities = ACTIVITIES.reduce(
      (hasFishingSoFar, fishingActivity) =>
        sketchActivities.includes(fishingActivity)
          ? hasFishingSoFar + 1
          : hasFishingSoFar,
      0
    );

    const curSketchMetric = sketchMetricsById[sketch.properties.id];

    return {
      ...curSketchMetric,
      numFishingRestricted: ACTIVITIES.length - numFishingActivities,
      overlap:
        curSketchMetric.value > 0 && numFishingActivities < ACTIVITIES.length,
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
      BREAK_MAP,
      sketchMetric.numFishingRestricted,
      sketchMetric.overlap
    );

  let edgeGroupMetrics = getGroupMetrics(
    Object.keys(BREAK_MAP),
    sketches,
    sketchMetricsFilter,
    edgeClassMetrics,
    { [CLASS.baseFilename]: { value: CLASS.totalArea } },
    { [CLASS.baseFilename]: edgeMultiPoly }
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
