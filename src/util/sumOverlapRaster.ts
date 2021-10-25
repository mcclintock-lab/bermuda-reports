import {
  Sketch,
  SketchCollection,
  Polygon,
  Feature,
  isSketchCollection,
  toSketchArray,
  loadCogWindow,
} from "@seasketch/geoprocessing";
import { featureCollection } from "@turf/helpers";
import { featureEach } from "@turf/meta";
import dissolve from "@turf/dissolve";
import bbox from "@turf/bbox";

// @ts-ignore
import geoblaze, { Georaster } from "geoblaze";
import { ClassMetric, ClassMetrics, SketchMetric } from "./types";

/**
 * calculate class metrics within single raster, conveniently bundling in class name and perc of total
 */
//  export async function rasterClassStats(
//   /** raster to search */
//   raster: Georaster,
//   config: {
//     /** Map from class ID to class name */
//     classIdToName: Record<string, string>;
//     /** Map from class ID to precalculate class total in raster */
//     classIdToTotal: Record<string, number>;
//   },
//   /** Optional polygon features, if present will calculate overlap for the features and not load the whole raster, otherwise calculates for whole raster  */
//   features?: Feature<Polygon>[]
// ): Promise<ClassMetrics> {
// }

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
): Promise<ClassMetric> {
  let sumValue = 0;
  let sketchMetrics: SketchMetric[] = [];
  if (sketch) {
    //TODO: use for overall value, avoiding sketch overlap
    const combinedSketch = isSketchCollection(sketch)
      ? dissolve(sketch)
      : featureCollection([sketch]);

    featureEach(sketch, (feat) => {
      // @ts-ignore
      const sketchValue = geoblaze.sum(raster, feat)[0];

      sumValue += sketchValue;
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
