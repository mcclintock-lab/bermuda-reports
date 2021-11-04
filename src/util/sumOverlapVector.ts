import {
  SketchCollection,
  Point,
  LineString,
  Polygon,
  FeatureCollection,
  isSketchCollection,
  isPolygonSketchCollection,
  isLineStringSketchCollection,
} from "@seasketch/geoprocessing";
import { featureCollection } from "@turf/helpers";
import combine from "@turf/combine";
import { featureEach } from "@turf/meta";
import { SketchMetric, ClassMetric } from "./types";
import dissolve from "@turf/dissolve";
import turfArea from "@turf/area";
import length from "@turf/length";

// NOT YET COMPLETE

/**
 * returns overlap metric for feature collection.  If sketch passed, metric is calculated for each sketch and overall
 * point - sum of points
 * linestring - sum of length
 * polygon - sum of area
 */
export async function overlapStatsVector(
  /** collection of features to intersect and get overlap stats */
  featureColl: FeatureCollection<Polygon | LineString | Point>,
  name: string,
  /** single sketch or collection. */
  sketch: SketchCollection<Point | LineString | Polygon>,
  /** geometry type of sketch */
  type: "point" | "linestring" | "polygon",
  /**
   * point - total number points
   * line - total length all lines
   * polygon - area of outer boundary (typically EEZ or planning area)
   */
  totalValue: number
): Promise<ClassMetric> {
  let combinedSketch: FeatureCollection;
  let combinedSketchValue: number = 0;
  if (isPolygonSketchCollection(sketch)) {
    combinedSketch = isSketchCollection(sketch)
      ? dissolve(sketch)
      : featureCollection([sketch]);
    combinedSketchValue = turfArea(combinedSketch);
  } else if (isLineStringSketchCollection(sketch)) {
    combinedSketchValue = length(featureColl);
  } else {
    combinedSketchValue = featureColl.features.length;
  }

  let sketchMetrics: SketchMetric[] = [];
  if (sketch) {
    featureEach(sketch, (feat) => {
      let sketchValue: number;
      if (isPolygonSketchCollection(sketch)) {
        // intersect and get area of remainder
        sketchValue = turfArea(feat);
      } else if (isLineStringSketchCollection(sketch)) {
        // intersect and get area of remainder
        sketchValue = length(feat);
      } else {
        // point in poly and return remainder
        sketchValue = 0;
      }
      sketchMetrics.push({
        id: feat.properties.id,
        name: feat.properties.name,
        value: sketchValue,
        percValue: sketchValue / totalValue,
      });
    });
  }

  return {
    name,
    value: combinedSketchValue,
    percValue: combinedSketchValue / totalValue,
    sketchMetrics,
  };
}
