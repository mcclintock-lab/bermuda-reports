import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
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
import { overlapStatsVector } from "../util/sumOverlapVector";
import { getGroupMetrics } from "../util/metrics";

const LAYER = config.platformEdge.layers[0];
const ACTIVITIES = config.platformEdge.fishingActivities;
const BREAK_MAP = config.platformEdge.breakMap;

export async function platformEdge(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<PlatformEdgeResult> {
  const sketches = toSketchArray(sketch);
  const box = sketch.bbox || bbox(sketch);

  const edgeMultiPoly = await fgbFetchAll<Feature<Polygon>>(
    `${config.dataBucketUrl}${LAYER.filename}`,
    box
  );

  const classMetric = await overlapStatsVector(
    edgeMultiPoly,
    LAYER.baseFilename,
    sketches,
    LAYER.totalArea
  );

  // Edge sketch metrics
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

  // Edge class metrics
  const edgeClassMetric = {
    ...classMetric,
    sketchMetrics: edgeSketchMetrics,
  };
  const edgeClassMetrics = { [edgeClassMetric.name]: edgeClassMetric };

  // Match sketch to first break group it has at least min number of restricted activities
  // If no overlap then it's always no break
  // Return true if matches current group
  const sketchFilter = (sketchMetric: EdgeSketchMetric, curGroup: string) => {
    const sketchGroup = getBreakGroup(
      sketchMetric.numFishingRestricted,
      sketchMetric.overlap
    );
    return sketchGroup === curGroup;
  };
  const getBreakGroup = (numFishingRestricted: number, overlap: boolean) => {
    if (!overlap) return "no";
    return Object.keys(BREAK_MAP).find(
      (breakGroup) => numFishingRestricted >= BREAK_MAP[breakGroup]
    );
  };

  // Edge group metrics
  const edgeGroupMetrics = getGroupMetrics(
    Object.keys(BREAK_MAP),
    sketchFilter,
    edgeClassMetrics,
    LAYER.totalArea
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
