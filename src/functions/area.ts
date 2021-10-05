import {
  Sketch,
  SketchCollection,
  Polygon,
  GeoprocessingHandler,
  sketchArea,
} from "@seasketch/geoprocessing";
import { STUDY_REGION_AREA_SQ_METERS } from "./areaConstants";

export interface AreaResults {
  /** area of the sketch in square meters */
  area: number;
  /** Percentage of the overall planning area */
  percPlanningArea: number;
}

export async function area(
  feature: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<AreaResults> {
  const featureArea = sketchArea(feature);

  return {
    area: featureArea,
    percPlanningArea: featureArea / STUDY_REGION_AREA_SQ_METERS,
  };
}

export default new GeoprocessingHandler(area, {
  title: "area",
  description: "Calculates area stats",
  timeout: 10, // seconds
  executionMode: "sync",
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
});
