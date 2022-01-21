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
import { Metric } from "./types";
import area from "@turf/area";
import flatten from "@turf/flatten";
import { chunk } from "../util/chunk";
import { clip } from "../util/clip";
import { createMetric } from "./metrics";

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
    calcSketchMetrics?: boolean;
    /** Operation to perform, supports area or sum.  Defaults to area */
    operation: "area" | "sum";
    sumProperty?: string;
  } = { calcSketchMetrics: true, operation: "area" }
): Promise<Metric[]> {
  let sumValue: number = 0;
  let isOverlap = false;
  const sketches = Array.isArray(sketch) ? sketch : toSketchArray(sketch);

  if (sketches.length > 0) {
    const sketchColl = flatten(featureCollection(sketches));
    const sketchArea = area(sketchColl);

    // If sketch overlap, use union
    const sketchUnion = clip(sketchColl.features, "union");
    if (!sketchUnion) throw new Error("overlapFeatures - something went wrong");
    const sketchUnionArea = area(sketchUnion);
    isOverlap = sketchUnionArea < sketchArea;

    const finalSketches =
      sketches.length > 1 && isOverlap ? flatten(sketchUnion) : sketchColl;

    featureEach(finalSketches, (feat) => {
      const curSum = doIntersect(
        feat,
        features as Feature<Polygon | MultiPolygon>[],
        options
      );
      sumValue += curSum;
    });
  }

  // Calc sketchMetrics if enabled
  let sketchMetrics: Metric[] = !options.calcSketchMetrics
    ? []
    : sketches.map((curSketch) => {
        let sketchValue: number = doIntersect(
          curSketch as Feature<Polygon | MultiPolygon>,
          features as Feature<Polygon | MultiPolygon>[],
          options
        );
        return createMetric({
          metricId,
          sketchId: curSketch.properties.id,
          value: sketchValue,
          extra: {
            sketchName: curSketch.properties.name,
          },
        });
      });

  if (!isOverlap && options.calcSketchMetrics) {
    sumValue = sketchMetrics.reduce((sumSoFar, sm) => sumSoFar + sm.value, 0);
  }

  if (isSketchCollection(sketch)) {
    // Push collection with accumulated sumValue
    sketchMetrics.push(
      createMetric({
        metricId,
        sketchId: sketch.properties.id,
        value: sumValue,
        extra: {
          sketchName: sketch.properties.name,
          isCollection: true,
        },
      })
    );
  }

  return sketchMetrics;
}

const doIntersect = (
  featureA: Feature<Polygon | MultiPolygon>,
  featuresB: Feature<Polygon | MultiPolygon>[],
  options: {
    /** Operation to perform, supports area or sum.  Defaults to area */
    operation: "area" | "sum";
    sumProperty?: string;
  }
) => {
  const { operation = "area" } = options;
  switch (operation) {
    case "sum":
      return getSketchPolygonIntersectSumValue(
        featureA,
        featuresB,
        options.sumProperty
      );
    default:
      return getSketchPolygonIntersectArea(featureA, featuresB);
  }
};

const getSketchPolygonIntersectArea = (
  featureA: Feature<Polygon | MultiPolygon>,
  featuresB: Feature<Polygon | MultiPolygon>[]
) => {
  // chunk to avoid blowing up intersect
  const chunks = chunk(featuresB, 2000);
  // intersect and get area of remainder
  const sketchValue = chunks
    .map((curChunk) => intersect(featureA, curChunk))
    .reduce((sumSoFar, rem) => (rem ? area(rem) + sumSoFar : sumSoFar), 0);
  return sketchValue;
};

/**
 * Sums the value of intersecting features.  No support for partial, counts the whole feature
 * @param featureA
 * @param featuresB
 * @param sumProperty
 * @returns
 */
const getSketchPolygonIntersectSumValue = (
  featureA: Feature<Polygon | MultiPolygon>,
  featuresB: Feature<Polygon | MultiPolygon>[],
  /** Property with value to sum, if not defined each feature will count as 1 */
  sumProperty?: string
) => {
  // intersect and get sum of remainder
  const sketchValue = featuresB
    .map((curFeature) => {
      const rem = intersect(featureA, curFeature);
      return {
        count: rem
          ? sumProperty
            ? curFeature.properties![sumProperty]
            : 1
          : 0,
        rem,
      };
    })
    .reduce((sumSoFar, { count }) => sumSoFar + count, 0);
  return sketchValue;
};
