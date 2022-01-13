import {
  Sketch,
  SketchCollection,
  Polygon,
  Feature,
  intersect,
  toSketchArray,
  isSketchCollection,
} from "@seasketch/geoprocessing";
import { featureCollection, MultiPolygon } from "@turf/helpers";
import { featureEach } from "@turf/meta";
import { SimpleSketchMetric } from "./types";
import area from "@turf/area";
import flatten from "@turf/flatten";
import { chunk } from "../util/chunk";
import { clip } from "../util/clip";

/**
 * Calculates overlap between sketches and features, including overall and per sketch
 * point - sum of points
 * linestring - sum of length
 * polygon - sum of area
 */
export async function overlapFeatures(
  metricId: string,
  /** features to intersect and get overlap stats */
  features: Feature<Polygon | MultiPolygon>[],
  /** the sketches.  If empty will return 0 result. */
  sketch: Sketch<Polygon> | SketchCollection<Polygon> | Sketch<Polygon>[],
  options: {
    /** Whether to calculate individual sketch metrics, otherwide just overall */
    calcSketchMetrics: boolean;
  } = { calcSketchMetrics: true }
): Promise<SimpleSketchMetric[]> {
  let sumValue: number = 0;
  let isOverlap = false;
  const sketches = Array.isArray(sketch) ? sketch : toSketchArray(sketch);

  if (sketches.length > 0) {
    const sketchColl = flatten(featureCollection(sketches));
    const sketchArea = area(sketchColl);

    // If sketch overlap, use union
    const sketchUnion = clip(sketchColl.features, "union");
    if (!sketchUnion)
      throw new Error("overlapFeaturesNext - something went wrong");
    const sketchUnionArea = area(sketchUnion);
    isOverlap = sketchUnionArea < sketchArea;

    const finalSketches =
      sketches.length > 1 && isOverlap ? flatten(sketchUnion) : sketchColl;

    featureEach(finalSketches, (feat) => {
      const curSum = getSketchPolygonIntersectArea(
        feat,
        features as Feature<Polygon | MultiPolygon>[]
      );
      sumValue += curSum;
    });
  }

  // Calc sketchMetrics if enabled
  let sketchMetrics: SimpleSketchMetric[] = !options.calcSketchMetrics
    ? []
    : sketches.map((curSketch) => {
        let sketchValue: number = 0;

        sketchValue = getSketchPolygonIntersectArea(
          curSketch as Feature<Polygon | MultiPolygon>,
          features as Feature<Polygon | MultiPolygon>[]
        );
        return {
          metricId,
          sketchId: curSketch.properties.id,
          value: sketchValue,
          extra: {
            sketchName: curSketch.properties.name,
          },
        };
      });

  if (!isOverlap && options.calcSketchMetrics) {
    sumValue = sketchMetrics.reduce((sumSoFar, sm) => sumSoFar + sm.value, 0);
  }

  if (isSketchCollection(sketch)) {
    // Push collection with accumulated sumValue
    sketchMetrics.push({
      metricId,
      sketchId: sketch.properties.id,
      value: sumValue,
      extra: {
        sketchName: sketch.properties.name,
        isCollection: true,
      },
    });
  }

  return sketchMetrics;
}

const getSketchPolygonIntersectArea = (
  feature: Feature<Polygon | MultiPolygon>,
  features: Feature<Polygon | MultiPolygon>[]
) => {
  // chunk to avoid blowing up intersect
  const chunks = chunk(features, 5000);
  // intersect and get area of remainder
  const sketchValue = chunks
    .map((curChunk) => intersect(feature, curChunk))
    .reduce((sumSoFar, rem) => (rem ? area(rem) + sumSoFar : sumSoFar), 0);
  return sketchValue;
};
