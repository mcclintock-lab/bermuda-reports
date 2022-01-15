import {
  Sketch,
  SketchCollection,
  Feature,
  Polygon,
  GeoprocessingHandler,
  fgbFetchAll,
  toNullSketch,
} from "@seasketch/geoprocessing";
import { overlapArea, overlapSubarea } from "../metrics/overlapArea";
import config, { STUDY_REGION_AREA_SQ_METERS, ReportResult } from "../_config";
import bbox from "@turf/bbox";
import { ReportSketchMetric } from "../metrics/types";
import { metricSort } from "../metrics/metrics";

const CONFIG = config.size;
const REPORT_ID = "size";
const METRIC_ID = "area";
const PERC_METRIC_ID = "areaPerc";

export async function area(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<ReportResult> {
  const box = sketch.bbox || bbox(sketch);
  const nearshorePolys = await fgbFetchAll<Feature<Polygon>>(
    `${config.dataBucketUrl}${CONFIG.filename}`,
    box
  );

  const eez = (
    await overlapArea(METRIC_ID, sketch, STUDY_REGION_AREA_SQ_METERS)
  ).map(
    (metrics): ReportSketchMetric => ({
      reportId: REPORT_ID,
      classId: "eez",
      ...metrics,
    })
  );

  const nearshore = (
    await overlapSubarea(METRIC_ID, sketch, nearshorePolys[0])
  ).map(
    (metrics): ReportSketchMetric => ({
      reportId: REPORT_ID,
      classId: "nearshore",
      ...metrics,
    })
  );

  const offshore = (
    await overlapSubarea(METRIC_ID, sketch, nearshorePolys[0], {
      operation: "difference",
      outerArea: STUDY_REGION_AREA_SQ_METERS,
    })
  ).map(
    (metrics): ReportSketchMetric => ({
      reportId: REPORT_ID,
      classId: "offshore",
      ...metrics,
    })
  );

  const metrics = metricSort([...eez, ...nearshore, ...offshore]);

  return {
    metrics,
    sketch: toNullSketch(sketch, true),
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
