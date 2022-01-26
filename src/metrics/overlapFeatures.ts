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
import { createMetric } from "./helpers";

interface OverlapFeatureOptions {
  /** Operation to perform, supports area or sum.  Defaults to area */
  operation: "area" | "sum";
  /** Intersection calls are chunked to avoid infinite loop error, defaults to 5000 features */
  chunkSize: number;
  /** If sketch collection, will include its child sketch metrics in addition to collection metrics, defaults to true */
  includeChildMetrics?: boolean;
  sumProperty?: string;
}

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
  options?: Partial<OverlapFeatureOptions>
): Promise<Metric[]> {
  const newOptions: OverlapFeatureOptions = {
    includeChildMetrics: true,
    operation: "area",
    chunkSize: 5000,
    ...(options || {}),
  };
  const { includeChildMetrics } = newOptions;
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

    if (isOverlap) {
      featureEach(finalSketches, (feat) => {
        const curSum = doIntersect(
          feat,
          features as Feature<Polygon | MultiPolygon>[],
          newOptions
        );
        sumValue += curSum;
      });
    }
  }

  let sketchMetrics: Metric[] = sketches.map((curSketch) => {
    let sketchValue: number = doIntersect(
      curSketch as Feature<Polygon | MultiPolygon>,
      features as Feature<Polygon | MultiPolygon>[],
      newOptions
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

  if (!isOverlap) {
    sumValue = sketchMetrics.reduce((sumSoFar, sm) => sumSoFar + sm.value, 0);
  }

  const collMetrics: Metric[] = (() => {
    if (isSketchCollection(sketch)) {
      // Push collection with accumulated sumValue
      return [
        createMetric({
          metricId,
          sketchId: sketch.properties.id,
          value: sumValue,
          extra: {
            sketchName: sketch.properties.name,
            isCollection: true,
          },
        }),
      ];
    } else {
      return [];
    }
  })();

  return [...(includeChildMetrics ? sketchMetrics : []), ...collMetrics];
}
const doIntersect = (
  featureA: Feature<Polygon | MultiPolygon>,
  featuresB: Feature<Polygon | MultiPolygon>[],
  options: OverlapFeatureOptions
) => {
  const { chunkSize, operation = "area" } = options;
  switch (operation) {
    case "sum":
      return getSketchPolygonIntersectSumValue(
        featureA,
        featuresB,
        options.sumProperty
      );
    default:
      return getSketchPolygonIntersectArea(featureA, featuresB, chunkSize);
  }
};

const getSketchPolygonIntersectArea = (
  featureA: Feature<Polygon | MultiPolygon>,
  featuresB: Feature<Polygon | MultiPolygon>[],
  chunkSize: number
) => {
  // chunk to avoid blowing up intersect
  const chunks = chunk(featuresB, chunkSize || 5000);
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
