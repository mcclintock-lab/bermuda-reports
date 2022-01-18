import {
  Sketch,
  SketchCollection,
  Feature,
  Polygon,
  GeoprocessingHandler,
  fgbFetchAll,
  toNullSketch,
  keyBy,
} from "@seasketch/geoprocessing";
import { overlapArea, overlapSubarea } from "../metrics/overlapArea";
import config, { STUDY_REGION_AREA_SQ_METERS, ReportResult } from "../_config";
import bbox from "@turf/bbox";
import { ReportSketchMetric } from "../metrics/types";
import { metricSort } from "../metrics/metrics";

const CONFIG = config;
const REPORT = CONFIG.size;
const METRIC = REPORT.metrics.areaOverlap;
if (!CONFIG || !REPORT || !METRIC)
  throw new Error("Problem accessing report config");

export async function area(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<ReportResult> {
  const box = sketch.bbox || bbox(sketch);
  const nearshorePolys = await fgbFetchAll<Feature<Polygon>>(
    `${CONFIG.dataBucketUrl}${METRIC.filename}`,
    box
  );
  const classesById = keyBy(METRIC.classes, (c) => c.classId);

  const eez = (
    await overlapArea(METRIC.metricId, sketch, STUDY_REGION_AREA_SQ_METERS)
  ).map(
    (metrics): ReportSketchMetric => ({
      reportId: REPORT.reportId,
      classId: classesById.eez.classId,
      ...metrics,
    })
  );

  const nearshore = (
    await overlapSubarea(METRIC.metricId, sketch, nearshorePolys[0])
  ).map(
    (metrics): ReportSketchMetric => ({
      reportId: REPORT.reportId,
      classId: classesById.nearshore.classId,
      ...metrics,
    })
  );

  const offshore = (
    await overlapSubarea(METRIC.metricId, sketch, nearshorePolys[0], {
      operation: "difference",
      outerArea: STUDY_REGION_AREA_SQ_METERS,
    })
  ).map(
    (metrics): ReportSketchMetric => ({
      reportId: REPORT.reportId,
      classId: classesById.offshore.classId,
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
