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

/**
 * Returns sum metric for raster.  If sketch passed, sum overlap is also calculated for each sketch polygon.
 * For sketch collections, dissolve is used when calculating total sketch value to prevent double counting
 */
export async function sumOverlapRaster(
  raster: Georaster,
  /** name/identifier for the raster */
  name: string,
  /** total sum value of raster, precalculated to avoid loading whole raster */
  totalValue: number,
  /** single sketch or collection. */
  sketch?: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<ClassMetricSketch> {
  let isOverlap = false;
  let sumValue = 0;
  let sketchMetrics: SketchMetric[] = [];
  if (sketch) {
    // If sketch overlap, calculate overall metric values from dissolve
    if (isSketchCollection(sketch)) {
      const sketchArea = area(sketch);
      const sketchUnion = clip(sketch.features, "union");
      if (!sketchUnion)
        throw new Error("sumOverlapRaster - something went wrong");
      const sketchUnionArea = area(sketchUnion);
      isOverlap = sketchUnionArea < sketchArea;
      if (isOverlap) {
        featureEach(sketchUnion, (feat) => {
          sumValue += geoblaze.sum(raster, feat)[0];
        });
      }
    }

    featureEach(sketch, (feat) => {
      const sketchValue = geoblaze.sum(raster, feat)[0];

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
