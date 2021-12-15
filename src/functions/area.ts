import {
  Sketch,
  SketchCollection,
  Feature,
  Polygon,
  GeoprocessingHandler,
  fgbFetchAll,
} from "@seasketch/geoprocessing";
import { areaStats, subAreaStats } from "../util/areaStats";
import config, { STUDY_REGION_AREA_SQ_METERS } from "../_config";
import bbox from "@turf/bbox";
import { ClassMetricSketch } from "../util/types";

export type AreaResultType = "eez" | "nearshore" | "offshore";
export type AreaResult = Record<AreaResultType, ClassMetricSketch>;

export async function area(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<AreaResult> {
  const box = sketch.bbox || bbox(sketch);
  const nearshorePolys = await fgbFetchAll<Feature<Polygon>>(
    `${config.dataBucketUrl}${config.size.filename}`,
    box
  );

  const eez = await areaStats("eez", sketch, STUDY_REGION_AREA_SQ_METERS);
  const nearshore = await subAreaStats(
    "nearshore",
    sketch,
    nearshorePolys[0] as Feature<Polygon>
  );
  const offshore = await subAreaStats(
    "offshore",
    sketch,
    nearshorePolys[0] as Feature<Polygon>,
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
