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
import config, { ReefIndexResults } from "../_config";
import { sumOverlapRaster } from "../util/sumOverlapRaster";

import reefIndexTotals from "../../data/precalc/reefIndexTotals.json";

// Define at module level for potential cache and reuse by Lambda
let rasters: Georaster[];
const LAYERS = config.reefIndex.layers;

export async function reefIndex(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<ReefIndexResults> {
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
        (reefIndexTotals as Record<string, number>)[lyr.baseFilename],
        sketch
      );
    })
  );

  return {
    reefIndex: keyBy(metrics, (metric) => metric.name),
  };
}

export default new GeoprocessingHandler(reefIndex, {
  title: "reefIndex",
  description: "high quality reef protection metrics",
  timeout: 240, // seconds
  executionMode: "async",
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
  memory: 4096,
});
