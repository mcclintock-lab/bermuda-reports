import {
  Sketch,
  SketchCollection,
  Polygon,
  isSketchCollection,
} from "@seasketch/geoprocessing";
import { featureEach } from "@turf/meta";
import { clip } from "../util/clip";
import area from "@turf/area";

// @ts-ignore
import geoblaze, { Georaster } from "geoblaze";
import { SimpleSketchMetric } from "./types";

function removeSketchPolygonHoles(sketch: Sketch<Polygon>) {
  const newSk: Sketch<Polygon> = { ...sketch };
  newSk.geometry.coordinates = [sketch.geometry.coordinates[0]];
  return newSk;
}

function removeSketchCollPolygonHoles(sketchColl: SketchCollection<Polygon>) {
  return sketchColl.features.map((sk) => removeSketchPolygonHoles(sk));
}

/**
 * Returns sum metric for raster.  If sketch parameter provided, sum overlap is also calculated for each sketch polygon.
 * For sketch collections, dissolve is used when calculating total sketch value to prevent double counting
 * Holes are removed by default from sketch polygons to prevent an apparent bug with Geoblaze overcounting when present.
 * Make sure that raster data is already clipped to land for example, to ensure it does not overcount.
 */
export async function overlapRaster(
  metricId: string,
  raster: Georaster,
  /** single sketch or collection. */
  sketch: Sketch<Polygon> | SketchCollection<Polygon>,
  options: {
    /** Whether to remove holes from sketch polygons. Geoblaze can overcount with them */
    removeSketchHoles: boolean;
  } = { removeSketchHoles: true }
): Promise<SimpleSketchMetric[]> {
  let isOverlap = false;
  let sumValue = 0;

  // If sketch collection and they overlap, accumulate collection total value using union
  if (isSketchCollection(sketch)) {
    const sketchArea = area(sketch);
    // Remove polygon holes (geoblaze polygon hole bug)
    const remSketches = options.removeSketchHoles
      ? removeSketchCollPolygonHoles(sketch)
      : sketch.features;
    // Remove overlap
    const sketchUnion = clip(remSketches, "union");
    if (!sketchUnion) throw new Error("overlapRaster - something went wrong");
    const sketchUnionArea = area(sketchUnion);
    // If there was overlap, use the union for accumulating sumValue
    isOverlap = sketchUnionArea < sketchArea;
    if (isOverlap) {
      featureEach(sketchUnion, (feat) => {
        sumValue += geoblaze.sum(raster, feat)[0];
      });
    }
  }

  // Get raster sum for each feature
  // If there was no overlap found above, accumulate collection sumValue here instead
  let sketchMetrics: SimpleSketchMetric[] = [];
  featureEach(sketch, (feat) => {
    const remSketch = options.removeSketchHoles
      ? removeSketchPolygonHoles(feat)
      : feat;
    const sketchValue = geoblaze.sum(raster, remSketch)[0];

    if (!isOverlap) {
      sumValue += sketchValue;
    }
    sketchMetrics.push({
      metricId,
      sketchId: feat.properties.id,
      value: sketchValue,
      extra: {
        sketchName: feat.properties.name,
      },
    });
  });

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
