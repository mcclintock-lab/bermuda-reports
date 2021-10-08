import {
  Sketch,
  SketchCollection,
  Polygon,
  GeoprocessingHandler,
} from "@seasketch/geoprocessing";
import { area as areaTool, AreaResults } from "../util/area";
import { STUDY_REGION_AREA_SQ_METERS, units } from "../_config";

export async function area(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<AreaResults> {
  return areaTool(sketch, STUDY_REGION_AREA_SQ_METERS);
}

export default new GeoprocessingHandler(area, {
  title: "area",
  description: "Calculates area stats",
  timeout: 10, // seconds
  executionMode: "sync",
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
});
