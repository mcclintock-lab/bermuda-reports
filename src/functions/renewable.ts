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
import bbox from "@turf/bbox";
import config, { RenewableResults } from "../_config";
import { sumOverlapRaster } from "../util/sumOverlapRaster";

import renewableTotals from "../../data/precalc/renewableTotals.json";

// Define at module level for potential cache and reuse by Lambda
let rasters: Georaster[];
const LAYERS = config.renewable.layers;

export async function renewable(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<RenewableResults> {
  const box = sketch.bbox || bbox(sketch);

  const metrics = await Promise.all(
    LAYERS.map(async (lyr) => {
      // start raster load and move on in loop while awaiting finish
      const raster = await loadCogWindow(
        `${config.dataBucketUrl}${lyr.filename}`,
        {
          windowBox: box,
          noDataValue: lyr.noDataValue,
        }
      );
      // start analysis as soon as source load done
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
  timeout: 240, // seconds
  executionMode: "async",
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
  memory: 8192,
});
