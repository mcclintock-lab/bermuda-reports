import {
  Sketch,
  SketchCollection,
  Polygon,
  Feature,
  Metric,
  toSketchArray,
  isSketchCollection,
  chunk,
  clip,
  clipMultiMerge,
  createMetric,
} from "@seasketch/geoprocessing";
import { featureCollection, MultiPolygon } from "@turf/helpers";
import { featureEach } from "@turf/meta";
import area from "@turf/area";
import flatten from "@turf/flatten";
import { toFeaturePolygonArray } from "@seasketch/geoprocessing/src/helpers";

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
 * Calculates overlap between sketch(es) and an array of polygon features.
 * Supports area or sum operation (given sumProperty), defaults to area
 * If sketch collection includes overall and per sketch
 *
 * OverlapFeatures now avoids double counting features in sum operation by
 * maintaining a list of indices that overlap with the sketch collection
 */
export async function overlapFeatures(
  metricId: string,
  /** features to intersect and get overlap stats */
  features: Feature<Polygon | MultiPolygon>[],
  /** the sketches.  If empty will return 0 result. */
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>
    | Sketch<Polygon | MultiPolygon>[],
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
  let featureIndices: Set<number> = new Set();
  const sketches = Array.isArray(sketch) ? sketch : toSketchArray(sketch);

  // Create individual sketch metrics
  const sketchMetrics: Metric[] = sketches.map((curSketch) => {
    const sketchValue =
      options?.operation === "sum"
        ? getSketchPolygonIntersectSumValue(
            curSketch as Feature<Polygon | MultiPolygon>,
            features as Feature<Polygon | MultiPolygon>[],
            newOptions.sumProperty
          )
        : getSketchPolygonIntersectArea(
            curSketch as Feature<Polygon | MultiPolygon>,
            features as Feature<Polygon | MultiPolygon>[],
            newOptions.chunkSize
          );

    sketchValue.indices.forEach((index) => featureIndices.add(index));

    return createMetric({
      metricId,
      sketchId: curSketch.properties.id,
      value: sketchValue.value,
      extra: {
        sketchName: curSketch.properties.name,
      },
    });
  });

  // Get overall sum value for collection
  if (sketches.length > 0) {
    const sketchColl = flatten(featureCollection(sketches));
    const sketchArea = area(sketchColl);

    // If sketch overlap, use union
    const sketchUnion = clip(sketchColl, "union");
    if (!sketchUnion) throw new Error("overlapFeatures - something went wrong");
    const sketchUnionArea = area(sketchUnion);
    isOverlap = sketchUnionArea < sketchArea;

    const finalSketches =
      sketches.length > 1 && isOverlap ? flatten(sketchUnion) : sketchColl;

    if (newOptions.operation === "sum") {
      featureIndices.forEach((index) => {
        const feature = features[index];
        if (!newOptions.sumProperty) {
          sumValue += 1;
        } else if (feature.properties![newOptions.sumProperty]) {
          sumValue += feature.properties![newOptions.sumProperty];
        } else {
          sumValue += 1;
        }
      });
    } else {
      featureEach(finalSketches, (feat) => {
        const curSum = getSketchPolygonIntersectArea(
          feat,
          features as Feature<Polygon | MultiPolygon>[],
          newOptions.chunkSize
        );
        sumValue += curSum.value;
      });
    }
  }

  // Create collection metric
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

const getSketchPolygonIntersectArea = (
  featureA: Feature<Polygon | MultiPolygon>,
  featuresB: Feature<Polygon | MultiPolygon>[],
  chunkSize: number
) => {
  // chunk to avoid blowing up intersect
  const chunks = chunk(featuresB, chunkSize || 5000);
  // intersect and get area of remainder
  const sketchValue = chunks
    .map((curChunk) => {
      const rem = clipMultiMerge(
        featureA,
        featureCollection(curChunk),
        "intersection"
      );
      return rem;
    })
    .reduce((sumSoFar, rem) => (rem ? area(rem) + sumSoFar : sumSoFar), 0);
  return { value: sketchValue, indices: [] };
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
  let indices: number[] = [];
  // intersect and get sum of remainder
  const sketchValue = featuresB
    .map((curFeature, index) => {
      const rem = clip(
        featureCollection([featureA, curFeature]),
        "intersection"
      );
      let count: number = 0;
      if (!rem) {
        count = 0;
      } else if (!sumProperty) {
        count = 1;
        indices.push(index);
      } else if (curFeature.properties![sumProperty] >= 0) {
        count = curFeature.properties![sumProperty];
        indices.push(index);
      } else {
        count = 1;
        indices.push(index);
      }
      return {
        count: count,
      };
    })
    .reduce((sumSoFar, { count }) => sumSoFar + count, 0);
  return { value: sketchValue, indices: indices };
};
