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
import { rasterClassStats } from "../util/overlapByClassRaster";
import { sumOverlapRaster } from "../util/sumOverlapRaster";

import nearshoreHabitatTotals from "../../data/precalc/nearshoreHabitatTotals.json";
import offshoreHabitatTotals from "../../data/precalc/offshoreHabitatTotals.json";

const OFFSHORE_LAYERS = config.offshore.layers;

export async function habitatProtection(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<HabitatResults> {
  const sketches = toSketchArray(sketch);
  const box = sketch.bbox || bbox(sketch);

  const nearshoreRaster = await loadCogWindow(
    `${config.dataBucketUrl}${config.nearshore.filename}`,
    { windowBox: box }
  );
  const nearshoreMetrics = await rasterClassStats(
    nearshoreRaster,
    {
      classIdToName: config.nearshore.classIdToName,
      classIdToTotal: nearshoreHabitatTotals,
    },
    sketches
  );

  const offshoreMetrics = await Promise.all(
    OFFSHORE_LAYERS.map(async (lyr) => {
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
        (offshoreHabitatTotals as Record<string, number>)[lyr.baseFilename],
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
  memory: 4096,
});
