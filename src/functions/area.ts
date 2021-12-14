import {
  Sketch,
  SketchCollection,
  Feature,
  MultiPolygon,
  Polygon,
  GeoprocessingHandler,
} from "@seasketch/geoprocessing";
import { areaStats, subAreaStats, AreaMetric } from "../util/areaStats";
import { STUDY_REGION_AREA_SQ_METERS } from "../_config";

// Multipolygon Feature Collection
import nearshoreFC from "../../data/dist/nearshore_dissolved.json";

export type AreaResultType = "eez" | "nearshore" | "offshore";
export type AreaResult = Record<AreaResultType, AreaMetric>;

export async function area(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<AreaResult> {
  const eez = await areaStats(sketch, STUDY_REGION_AREA_SQ_METERS);
  const nearshore = await subAreaStats(
    sketch,
    nearshoreFC.features[0] as Feature<MultiPolygon>
  );
  const offshore = await subAreaStats(
    sketch,
    nearshoreFC.features[0] as Feature<MultiPolygon>,
    { operation: "difference", outerArea: STUDY_REGION_AREA_SQ_METERS }
  );

  return {
    eez,
    nearshore,
    offshore,
  };
}

export default new GeoprocessingHandler(area, {
  title: "area",
  description: "Calculates area stats",
  timeout: 120, // seconds
  executionMode: "async",
  // Specify any Sketch Class form attributes that are required
  memory: 8192,
  requiresProperties: [],
});
