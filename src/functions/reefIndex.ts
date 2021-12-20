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
import { overlapRaster } from "../metrics/overlapRaster";

import reefIndexTotals from "../../data/precalc/reefIndexTotals.json";

// Define at module level for potential cache and reuse by Lambda
let rasters: Georaster[];
const CLASSES = config.reefIndex.classes;

export async function reefIndex(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<ReefIndexResults> {
  const box = sketch.bbox || bbox(sketch);

  rasters = await Promise.all(
    CLASSES.map((curClass) =>
      loadCogWindow(`${config.dataBucketUrl}${curClass.filename}`, {
        windowBox: box,
        noDataValue: curClass.noDataValue,
      })
    )
  );

  const metrics = await Promise.all(
    rasters.map(async (raster, index) => {
      const curClass = CLASSES[index];
      return overlapRaster(
        raster,
        curClass.name,
        (reefIndexTotals as Record<string, number>)[curClass.name],
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
  timeout: 300, // seconds
  executionMode: "async",
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
  memory: 8192,
});
