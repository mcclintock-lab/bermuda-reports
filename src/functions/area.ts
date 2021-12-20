import {
  Sketch,
  SketchCollection,
  Feature,
  Polygon,
  GeoprocessingHandler,
  fgbFetchAll,
} from "@seasketch/geoprocessing";
import { overlapArea, overlapSubarea } from "../metrics/overlapArea";
import config, { STUDY_REGION_AREA_SQ_METERS, AreaResults } from "../_config";
import bbox from "@turf/bbox";

const CONFIG = config.size;
const CLASS = CONFIG.classes[0];

export async function area(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<AreaResults> {
  const box = sketch.bbox || bbox(sketch);
  const nearshorePolys = await fgbFetchAll<Feature<Polygon>>(
    `${config.dataBucketUrl}${CLASS.filename}`,
    box
  );

  const eez = await overlapArea("eez", sketch, STUDY_REGION_AREA_SQ_METERS);
  const nearshore = await overlapSubarea(
    "nearshore",
    sketch,
    nearshorePolys[0]
  );
  const offshore = await overlapSubarea("offshore", sketch, nearshorePolys[0], {
    operation: "difference",
    outerArea: STUDY_REGION_AREA_SQ_METERS,
  });

  return {
    byClass: {
      eez,
      nearshore,
      offshore,
    },
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
