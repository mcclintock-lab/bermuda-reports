import {
  Sketch,
  SketchCollection,
  GeoprocessingHandler,
  Polygon,
  loadCogWindow,
  keyBy,
} from "@seasketch/geoprocessing";
import bbox from "@turf/bbox";
import config, { RenewableResults } from "../_config";
import { overlapRaster } from "../metrics/overlapRaster";

import renewableTotals from "../../data/precalc/renewableTotals.json";

const CLASSES = config.renewable.layers;

export async function renewable(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<RenewableResults> {
  const box = sketch.bbox || bbox(sketch);

  const metrics = await Promise.all(
    CLASSES.map(async (curClass) => {
      // start raster load and move on in loop while awaiting finish
      const raster = await loadCogWindow(
        `${config.dataBucketUrl}${curClass.filename}`,
        {
          windowBox: box,
          noDataValue: curClass.noDataValue,
        }
      );
      // start analysis as soon as source load done
      return overlapRaster(
        raster,
        curClass.baseFilename,
        (renewableTotals as Record<string, number>)[curClass.baseFilename],
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
