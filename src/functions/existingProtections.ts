import {
  Sketch,
  SketchCollection,
  GeoprocessingHandler,
  Polygon,
  isFeatureCollection,
  fgbFetchAll,
  areaOverlapByClassVector,
  roundDecimal,
} from "@seasketch/geoprocessing";
import bbox from "@turf/bbox";
import dissolve from "@turf/dissolve";
import { featureCollection } from "@turf/helpers";
import config, {
  classProperty,
  OverlapFeature,
  OverlapResult,
} from "./existingProtectionsConfig";
import legislatedAreaStats from "../../data/precalc/legislated.json";

// Defined at module level for potential caching/reuse by serverless process
let featuresToIntersect: OverlapFeature[] = [];

export async function existingProtections(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<OverlapResult> {
  const sketchColl = isFeatureCollection(sketch)
    ? dissolve(sketch)
    : featureCollection([sketch]);
  const box = sketch.bbox || bbox(sketch);

  featuresToIntersect = await fgbFetchAll<OverlapFeature>(
    `${config.dataBucketUrl}${config.filename}`,
    box
  );

  const areaByClass = await areaOverlapByClassVector(
    sketchColl,
    featuresToIntersect,
    config.classProperty
  );

  return {
    ...legislatedAreaStats,
    areaByClass: legislatedAreaStats.areaByClass.map((ac) => ({
      ...ac,
      sketchArea: roundDecimal(areaByClass[ac.class] || 0, 6),
    })),
    areaUnit: "square meters",
  };
}

export default new GeoprocessingHandler(existingProtections, {
  title: "existingProtections",
  description: "Find which legislated areas the sketch overlaps with",
  timeout: 180, // seconds
  executionMode: "async",
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
});
