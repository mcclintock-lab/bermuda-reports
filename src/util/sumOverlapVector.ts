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
import { featureCollection, MultiPolygon } from "@turf/helpers";
import combine from "@turf/combine";
import { featureEach } from "@turf/meta";
import { SketchMetric, ClassMetric, ClassMetricSketch } from "./types";
import dissolve from "@turf/dissolve";
import area from "@turf/area";
import length from "@turf/length";
import flatten from "@turf/flatten";
import { chunk } from "../util/chunk";
// @ts-ignore
import geoblaze, { Georaster } from "geoblaze";

/**
 * returns overlap metric for feature collection.  If sketch passed, metric is calculated for each sketch and overall
 * point - sum of points
 * linestring - sum of length
 * polygon - sum of area
 */
export async function overlapStatsVector(
  /** collection of features to intersect and get overlap stats */
  features: Feature<Point | LineString | Polygon | MultiPolygon>[],
  /** Name of class */
  name: string,
  /** single sketch or collection. */
  sketches: Sketch<Point | LineString | Polygon>[],
  /**
   * point - total number points
   * line - total length all lines
   * polygon - area of outer boundary (typically EEZ or planning area)
   */
  totalValue: number,
  options: {
    /** Whether to calculate individual sketch areas, otherwide just overall */
    includeSketchMetrics: boolean;
  } = { includeSketchMetrics: true }
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

  let sumValue: number = 0;
  let isOverlap = false;

  // If sketch overlap, calculate overall metric values from dissolve
  if (sketches.length > 1) {
    const sketchColl = flatten(
      featureCollection(sketches as Feature<Polygon | MultiPolygon>[])
    );
    const sketchArea = area(sketchColl);
    const combinedSketch = dissolve(sketchColl);
    const combinedArea = area(combinedSketch);
    isOverlap = combinedArea < sketchArea;
    if (isOverlap) {
      featureEach(combinedSketch, (feat) => {
        const curSum = getSketchPolygonIntersectArea(
          feat,
          features as Feature<Polygon | MultiPolygon>[]
        );
        sumValue += curSum;
      });
    }
  }

  // Calc sketchMetrics if enabled
  const sketchMetrics = !options.includeSketchMetrics
    ? []
    : sketches.map((curSketch) => {
        let sketchValue: number = 0;

        if (isPolygonFeature(curSketch)) {
          sketchValue = getSketchPolygonIntersectArea(
            curSketch,
            features as Feature<Polygon | MultiPolygon>[]
          );
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

  if (!isOverlap) {
    sumValue = sketchMetrics.reduce((sumSoFar, sm) => sumSoFar + sm.value, 0);
  }

  return {
    name,
    value: sumValue,
    percValue: sumValue / totalValue,
    sketchMetrics,
  };
}

const getSketchPolygonIntersectArea = (
  feature: Feature<Polygon>,
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
