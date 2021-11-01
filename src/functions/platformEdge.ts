import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
  Feature,
  GeoprocessingHandler,
  fgbFetchAll,
  intersect,
  toSketchArray,
} from "@seasketch/geoprocessing";
import { getJsonUserAttribute } from "../util/getJsonUserAttribute";
import { AreaMetric } from "../util/areaStats";
import bbox from "@turf/bbox";
import turfArea from "@turf/area";
import config from "../_config";

export const PLATFORM_EDGE_AREA = 1734231963.998059; // Calculated manually with turf/area using dist/Pelagic_Fishing_Zone_Dissolved.json
const FILENAME = "Pelagic_Fishing_Zone_Dissolved.fgb";

export type PlatformEdgeResult = Record<
  "edge",
  AreaMetric & { overlapCount: number; totalCount: number }
>;

export async function platformEdge(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<PlatformEdgeResult> {
  const sketches = toSketchArray(sketch);
  const box = sketch.bbox || bbox(sketch);

  const edgeMultiPoly = await fgbFetchAll<Feature<MultiPolygon>>(
    `${config.dataBucketUrl}${FILENAME}`,
    box
  );

  // intersect each sketch with nearshore multipoly array
  const rem = sketches.reduce<{ area: number; count: number }>(
    (result, sketch, index) => {
      const remPoly = intersect(sketch, edgeMultiPoly);

      const fishingActivities = [
        "TRAD_FISH_COLLECT",
        "FISH_COLLECT_REC",
        "FISH_COLLECT_LOCAL",
        "FISH_AQUA_INDUSTRIAL",
      ];
      const sketchActivities: string[] = getJsonUserAttribute(
        sketch,
        "ACTIVITIES",
        []
      );
      const numFishing = fishingActivities.reduce(
        (hasFishingSoFar, fishingActivity) =>
          sketchActivities.includes(fishingActivity)
            ? hasFishingSoFar + 1
            : hasFishingSoFar,
        0
      );

      // If sketch overlaps and all fishing activity allowed then count as overlap and add area to sum
      return remPoly && numFishing === 0
        ? { area: result.area + turfArea(remPoly), count: result.count + 1 }
        : result;
    },
    { area: 0, count: 0 }
  );

  return {
    edge: {
      area: rem.area,
      percArea: rem.area / PLATFORM_EDGE_AREA,
      totalCount: sketches.length,
      overlapCount: rem.count,
      areaUnit: "square meters",
      sketchAreas: [],
    },
  };
}

export default new GeoprocessingHandler(platformEdge, {
  title: "platformEdge",
  description: "Calculates area stats",
  timeout: 20, // seconds
  executionMode: "async",
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
});
