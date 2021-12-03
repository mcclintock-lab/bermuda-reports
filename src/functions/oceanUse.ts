import {
  Sketch,
  SketchCollection,
  GeoprocessingHandler,
  Polygon,
  Georaster,
  loadCogWindow,
  keyBy,
} from "@seasketch/geoprocessing";
import bbox from "@turf/bbox";
import { sumOverlapRaster } from "../util/sumOverlapRaster";
import config, { OceanUseResults } from "../_config";

import oceanUseTotals from "../../data/precalc/oceanUseTotals.json";

// Define at module level for potential cache and reuse by Lambda
const LAYERS = config.oceanUse.layers;

export async function oceanUse(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<OceanUseResults> {
  const box = sketch.bbox || bbox(sketch);
  let rasters: Georaster[];

  const metrics = await Promise.all(
    LAYERS.map(async (lyr) => {
      // start raster load and move on in loop while awaiting finish
      const raster = await loadCogWindow(
        `${config.dataBucketUrl}${lyr.filename}`,
        {
          windowBox: box,
        }
      );
      // start analysis as soon as source load done
      return sumOverlapRaster(
        raster,
        lyr.baseFilename,
        (oceanUseTotals as Record<string, number>)[lyr.baseFilename],
        sketch
      );
    })
  );

  return {
    byClass: keyBy(metrics, (metric) => metric.name),
  };
}

export default new GeoprocessingHandler(oceanUse, {
  title: "oceanUse",
  description: "ocean use survey stats",
  timeout: 180, // seconds
  executionMode: "async",
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
  memory: 8192,
});
