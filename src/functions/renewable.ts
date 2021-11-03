import {
  Sketch,
  SketchCollection,
  GeoprocessingHandler,
  Polygon,
  toSketchArray,
  isSketchCollection,
  Georaster,
  loadCogWindow,
  keyBy,
} from "@seasketch/geoprocessing";
import dissolve from "@turf/dissolve";
import bbox from "@turf/bbox";
import { featureCollection } from "@turf/helpers";
import config, { RenewableResults } from "../_config";
import { sumOverlapRaster } from "../util/sumOverlapRaster";

import renewableTotals from "../../data/precalc/renewableTotals.json";

// Define at module level for potential cache and reuse by Lambda
let rasters: Georaster[];
const LAYERS = config.renewable.layers;

export async function renewable(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<RenewableResults> {
  const sketches = toSketchArray(sketch);
  const combinedSketch = isSketchCollection(sketch)
    ? dissolve(sketch)
    : featureCollection([sketch]);
  const box = sketch.bbox || bbox(sketch);

  rasters = await Promise.all(
    LAYERS.map((lyr) =>
      loadCogWindow(`${config.dataBucketUrl}${lyr.filename}`, {
        windowBox: box,
        noDataValue: lyr.noDataValue,
      })
    )
  );

  const metrics = await Promise.all(
    rasters.map(async (raster, index) => {
      const lyr = LAYERS[index];
      return sumOverlapRaster(
        raster,
        lyr.baseFilename,
        (renewableTotals as Record<string, number>)[lyr.baseFilename],
        sketch
      );
    })
  );

  return {
    renewable: keyBy(metrics, (metric) => metric.name),
  };
}

export default new GeoprocessingHandler(renewable, {
  title: "renewable",
  description: "high quality reef protection metrics",
  timeout: 180, // seconds
  executionMode: "async",
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
  memory: 8192,
});
