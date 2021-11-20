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
import { getBreakGroup } from "../util/platformEdge";

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
  const sketchFilter = (sketchMetric: EdgeSketchMetric, curGroup: string) =>
    curGroup ===
    getBreakGroup(
      BREAK_MAP,
      sketchMetric.numFishingRestricted,
      sketchMetric.overlap
    );

  let edgeGroupMetrics = getGroupMetrics(
    Object.keys(BREAK_MAP),
    sketchFilter,
    edgeClassMetrics,
    LAYER.totalArea
  );

  // If sketch collection, recalc group overall stats, accounting for overlap
  if (sketches.length > 1) {
    Object.keys(BREAK_MAP).forEach((breakName) => {
      Object.keys(edgeGroupMetrics[breakName]).forEach(async (className) => {
        // Get sketches in group
        const sketchIds = edgeGroupMetrics[breakName][
          className
        ].sketchMetrics.map((sm) => sm.id);
        const groupSketches = sketches.filter((sk) =>
          sketchIds.includes(sk.properties.id)
        );
        // only recalc if more than one sketch in group
        if (groupSketches.length > 1) {
          const groupOverallMetric = await overlapStatsVector(
            edgeMultiPoly,
            LAYER.baseFilename,
            groupSketches,
            LAYER.totalArea,
            { includeSketchMetrics: false }
          );
          edgeGroupMetrics[breakName][className].value =
            groupOverallMetric.value;
          edgeGroupMetrics[breakName][className].percValue =
            groupOverallMetric.percValue;
        }
      });
    });
  }

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
