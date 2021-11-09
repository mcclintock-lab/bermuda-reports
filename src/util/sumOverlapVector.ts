import {
  SketchCollection,
  Sketch,
  Point,
  LineString,
  Polygon,
  Feature,
  FeatureCollection,
  isSketchCollection,
  isPolygonSketchCollection,
  isPolygonFeature,
  isLineStringSketchCollection,
  intersect,
  toSketchArray,
} from "@seasketch/geoprocessing";
import { featureCollection } from "@turf/helpers";
import combine from "@turf/combine";
import { featureEach } from "@turf/meta";
import { SketchMetric, ClassMetric, ClassMetricSketch } from "./types";
import dissolve from "@turf/dissolve";
import turfArea from "@turf/area";
import length from "@turf/length";
import { chunk } from "../util/chunk";

/**
 * returns overlap metric for feature collection.  If sketch passed, metric is calculated for each sketch and overall
 * point - sum of points
 * linestring - sum of length
 * polygon - sum of area
 */
export async function overlapStatsVector(
  /** collection of features to intersect and get overlap stats */
  features: Feature<Point | LineString | Polygon>[],
  /** Name of class */
  name: string,
  /** single sketch or collection. */
  sketches: Sketch<Point | LineString | Polygon>[],
  /**
   * point - total number points
   * line - total length all lines
   * polygon - area of outer boundary (typically EEZ or planning area)
   */
  totalValue: number
): Promise<ClassMetricSketch> {
  // This is incomplete and not yet used
  // let combinedSketch: FeatureCollection;
  // let combinedSketchValue: number = 0;
  // if (isPolygonSketchCollection(sketch)) {
  //   combinedSketch = isSketchCollection(sketch)
  //     ? dissolve(sketch)
  //     : featureCollection([sketch]);
  //   combinedSketchValue = turfArea(combinedSketch);
  // } else if (isLineStringSketchCollection(sketch)) {
  //   combinedSketchValue = length(sketch);
  // } else {
  //   combinedSketchValue = sketch.features.length;
  // }

  const sketchMetrics = sketches.map((curSketch) => {
    let sketchValue: number = 0;
    if (isPolygonFeature(curSketch)) {
      // intersect and get area of remainder
      try {
        const clippedFeatures = intersect(
          curSketch,
          features as Feature<Polygon>[]
        );
        sketchValue = clippedFeatures ? turfArea(clippedFeatures) : 0;
      } catch (err) {
        // assume failed due to size, fallback to chunking
        const chunks = chunk(features as Feature<Polygon>[], 1000);
        sketchValue = chunks
          .map((curChunk) => intersect(curSketch, curChunk))
          .reduce(
            (sumValue, rem) => (rem ? turfArea(rem) + sumValue : sumValue),
            0
          );
      }
    }
    // else if (isLineStringSketchCollection(sketch)) {
    //   // intersect and get area of remainder
    //   sketchValue = length(curSketch);
    // } else {
    //   // point in poly and return remainder
    //   sketchValue = 0;
    // }
    return {
      id: curSketch.properties.id,
      name: curSketch.properties.name,
      value: sketchValue,
      percValue: sketchValue / totalValue,
    };
  });

  const sumSketchValue = sketchMetrics.reduce(
    (sumSoFar, sm) => sumSoFar + sm.value,
    0
  );

  return {
    name,
    value: sumSketchValue,
    percValue: sumSketchValue / totalValue,
    sketchMetrics,
  };
}
