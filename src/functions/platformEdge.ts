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
import { ClassMetricSketch, ClassMetric, SketchMetric } from "../util/types";
import bbox from "@turf/bbox";
import config, { PlatformEdgeResult } from "../_config";
import { overlapStatsVector } from "../util/sumOverlapVector";

const fishingActivities = [
  "TRAD_FISH_COLLECT",
  "FISH_COLLECT_REC",
  "FISH_COLLECT_LOCAL",
  "FISH_AQUA_INDUSTRIAL",
];

const LAYER = config.platformEdge.layers[0];

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

  const sketchMetricsById = keyBy(classMetric.sketchMetrics, (item) => item.id);

  const edgeSketchMetrics = sketches.map((sketch) => {
    const sketchActivities: string[] = getJsonUserAttribute(
      sketch,
      "ACTIVITIES",
      []
    );
    const numFishingActivities = fishingActivities.reduce(
      (hasFishingSoFar, fishingActivity) =>
        sketchActivities.includes(fishingActivity)
          ? hasFishingSoFar + 1
          : hasFishingSoFar,
      0
    );

    const curSketchMetric = sketchMetricsById[sketch.properties.id];

    return {
      ...curSketchMetric,
      overlap:
        curSketchMetric.value > 0 &&
        numFishingActivities < fishingActivities.length,
    };
  });

  return {
    edge: {
      ...classMetric,
      sketchMetrics: edgeSketchMetrics,
    },
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
