import {
  Sketch,
  SketchCollection,
  Polygon,
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

export interface SapMetric {
  /** sap map name */
  name: string;
  /** Sum of all value in SAP map */
  value: number;
  /** Proportion of sketch value to total value */
  percValue: number;
  sketchMetrics: {
    sketchId: string;
    name: string;
    value: number;
    percValue: number;
  }[];
}
/**
 * Returns value stats for sketch input in relation to SAP map`.
 * For sketch collections, dissolve is used when calculating total sketch area to prevent double counting
 */
export async function sapStats(
  name: string,
  url: string,
  /** single sketch or collection. */
  sketch: Sketch<Polygon> | SketchCollection<Polygon>,
  /** total value of SAP map, precalculated to avoid loading whole raster */
  totalValue: number,
  options: {
    /** Whether to calculate individual sketch areas, otherwide just overall */
    includeSketchAreas: boolean;
  } = { includeSketchAreas: true }
): Promise<SapMetric> {
  const sketches = toSketchArray(sketch);
  const combinedSketch = isSketchCollection(sketch)
    ? dissolve(sketch)
    : featureCollection([sketch]);
  const box = sketch.bbox || bbox(sketch);
  const raster: Georaster = await loadCogWindow(url, { windowBox: box });

  let sumValue = 0;
  let sketchMetrics: SapMetric["sketchMetrics"] = [];
  if (options?.includeSketchAreas) {
    featureEach(sketch, (feat) => {
      // @ts-ignore
      const sketchValue = geoblaze.sum(raster, feat)[0];

      sumValue += sketchValue;
      sketchMetrics.push({
        sketchId: feat.properties.id,
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
