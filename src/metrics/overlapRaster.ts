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
import { ClassMetricSketch, SketchMetric } from "./types";

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
  raster: Georaster,
  /** name/identifier for the raster */
  name: string,
  /** total sum value of raster, precalculated to avoid loading whole raster */
  totalValue: number,
  /** single sketch or collection. */
  sketch?: Sketch<Polygon> | SketchCollection<Polygon>,
  options: {
    /** Whether to remove holes from sketch polygons. Geoblaze can overcount with them */
    removeSketchHoles: boolean;
  } = { removeSketchHoles: true }
): Promise<ClassMetricSketch> {
  let isOverlap = false;
  let sumValue = 0;
  let sketchMetrics: SketchMetric[] = [];
  if (sketch) {
    // If sketch overlap, calculate overall metric values from dissolve
    if (isSketchCollection(sketch)) {
      const sketchArea = area(sketch);
      const remSketches = options.removeSketchHoles
        ? removeSketchCollPolygonHoles(sketch)
        : sketch.features;
      const sketchUnion = clip(remSketches, "union");
      if (!sketchUnion) throw new Error("overlapRaster - something went wrong");
      const sketchUnionArea = area(sketchUnion);
      isOverlap = sketchUnionArea < sketchArea;
      if (isOverlap) {
        featureEach(sketchUnion, (feat) => {
          sumValue += geoblaze.sum(raster, feat)[0];
        });
      }
    }

    featureEach(sketch, (feat) => {
      const remSketch = options.removeSketchHoles
        ? removeSketchPolygonHoles(feat)
        : feat;
      const sketchValue = geoblaze.sum(raster, remSketch)[0];

      if (!isOverlap) {
        sumValue += sketchValue;
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
    value: sumValue,
    percValue: sumValue / totalValue,
    sketchMetrics,
  };
}
