import {
  Sketch,
  SketchCollection,
  GeoprocessingHandler,
  Polygon,
  toSketchArray,
  loadCogWindow,
  keyBy,
} from "@seasketch/geoprocessing";
import bbox from "@turf/bbox";
import config, { HabitatResults } from "../_config";
import { overlapRasterClass } from "../metrics/overlapRasterClass";
import { overlapRaster } from "../metrics/overlapRaster";

import nearshoreHabitatTotals from "../../data/precalc/nearshoreHabitatTotals.json";
import offshoreHabitatTotals from "../../data/precalc/offshoreHabitatTotals.json";

const OFFSHORE_CLASSES = config.offshore.classes;

export async function habitatProtection(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<HabitatResults> {
  const sketches = toSketchArray(sketch);
  const box = sketch.bbox || bbox(sketch);

  const nearshoreRaster = await loadCogWindow(
    `${config.dataBucketUrl}${config.nearshore.filename}`,
    { windowBox: box }
  );
  if (!config.nearshore.classIdToName) {
    throw new Error("Expected classIdToName to be configured");
  }
  const nearshoreMetrics = await overlapRasterClass(
    nearshoreRaster,
    {
      classIdToName: config.nearshore.classIdToName,
      classIdToTotal: nearshoreHabitatTotals,
    },
    sketches
  );

  const offshoreMetrics = await Promise.all(
    OFFSHORE_CLASSES.map(async (curClass) => {
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
        curClass.name,
        (offshoreHabitatTotals as Record<string, number>)[curClass.name],
        sketch
      );
    })
  );

  return {
    nearshore: nearshoreMetrics,
    offshore: keyBy(offshoreMetrics, (metric) => metric.name),
  };
}

export default new GeoprocessingHandler(habitatProtection, {
  title: "habitatProtection",
  description: "habitat protection metrics",
  timeout: 240, // seconds
  executionMode: "async",
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
  memory: 8192,
});
