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
import { overlapRaster } from "../metrics/overlapRaster";
import config, { OceanUseResults } from "../_config";

import oceanUseTotals from "../../data/precalc/oceanUseTotals.json";

// Define at module level for potential cache and reuse by Lambda
const CLASSES = config.oceanUse.classes;

export async function oceanUse(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<OceanUseResults> {
  const box = sketch.bbox || bbox(sketch);
  let rasters: Georaster[];

  const metrics = await Promise.all(
    CLASSES.map(async (curClass) => {
      // start raster load and move on in loop while awaiting finish
      const raster = await loadCogWindow(
        `${config.dataBucketUrl}${curClass.filename}`,
        {
          windowBox: box,
        }
      );
      // start analysis as soon as source load done
      return overlapRaster(
        raster,
        curClass.classId,
        (oceanUseTotals as Record<string, number>)[curClass.classId],
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
