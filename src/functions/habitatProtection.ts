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
import config from "../_config";
import { rasterClassStats } from "../util/overlapByClassRaster";
import { ClassMetrics } from "../util/types";
import { sumOverlapRaster } from "../util/sumOverlapRaster";

import nearshoreHabitatTotals from "../../data/precalc/nearshoreHabitatTotals.json";
import offshoreHabitatTotals from "../../data/precalc/offshoreHabitatTotals.json";

// Define at module level for potential cache and reuse by Lambda
let nearshoreRaster: Georaster;
let offshoreRasters: Georaster[];

interface HabitatResults {
  nearshore: ClassMetrics;
  offshore: ClassMetrics;
}

export async function habitatProtection(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<HabitatResults> {
  const sketches = toSketchArray(sketch);
  const combinedSketch = isSketchCollection(sketch)
    ? dissolve(sketch)
    : featureCollection([sketch]);
  const box = sketch.bbox || bbox(sketch);

  // Fetch raster windows with extent of sketch bbox
  nearshoreRaster = await loadCogWindow(
    `${config.dataBucketUrl}${config.nearshore.filename}`,
    { windowBox: box }
  );

  offshoreRasters = await Promise.all(
    config.offshore.layers.map((lyr) =>
      loadCogWindow(`${config.dataBucketUrl}${lyr.filename}`, {
        windowBox: box,
        noDataValue: lyr.noDataValue,
      })
    )
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
    offshoreRasters.map(async (raster, index) => {
      const lyr = config.offshore.layers[index];
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
  description: "ocean use survey stats",
  timeout: 30, // seconds
  executionMode: "async",
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
  memory: 2048,
});
