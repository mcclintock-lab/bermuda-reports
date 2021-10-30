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
  isSketchCollection,
} from "@seasketch/geoprocessing";
import { AreaMetric } from "../util/areaStats";
import bbox from "@turf/bbox";
import turfArea from "@turf/area";
import dissolve from "@turf/dissolve";
import config from "../_config";
import { featureCollection } from "@turf/helpers";

export const PLATFORM_EDGE_AREA = 1734231963.998059; // Calculated manually with turf/area using dist/Pelagic_Fishing_Zone_Dissolved.json
const FILENAME = "Pelagic_Fishing_Zone_Dissolved.fgb";

export type PlatformEdgeResult = Record<
  "edge",
  AreaMetric & { overlapCount: number }
>;

export async function area(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<PlatformEdgeResult> {
  const sketches = toSketchArray(sketch);
  const box = sketch.bbox || bbox(sketch);
  const combinedSketch = isSketchCollection(sketch)
    ? dissolve(sketch)
    : featureCollection([sketch]);
  const edgeMultiPoly = await fgbFetchAll<Feature<MultiPolygon>>(
    `${config.dataBucketUrl}${FILENAME}`,
    box
  );

  const remainder = intersect(edgeMultiPoly[0], sketches);
  if (!remainder) {
    return {
      edge: {
        area: 0,
        percArea: 0,
        sketchAreas: [],
        areaUnit: "square meters",
        overlapCount: 0,
      },
    };
  } else {
    const area = turfArea(remainder);

    const overlapCount = sketches
      .map((sketch) => !!intersect(edgeMultiPoly[0], sketch))
      .reduce((count, intersects) => (intersects ? count + 1 : count), 0);

    return {
      edge: {
        area,
        percArea: area / PLATFORM_EDGE_AREA,
        overlapCount,
        areaUnit: "square meters",
        sketchAreas: [],
      },
    };
  }
}

export default new GeoprocessingHandler(area, {
  title: "platformEdge",
  description: "Calculates area stats",
  timeout: 10, // seconds
  executionMode: "sync",
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
});
