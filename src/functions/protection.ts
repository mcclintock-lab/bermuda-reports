import {
  Sketch,
  SketchCollection,
  Polygon,
  GeoprocessingHandler,
  toSketchArray,
  keyBy,
  toNullSketch,
} from "@seasketch/geoprocessing";
import { overlapArea } from "../metrics/overlapAreaNext";
import { STUDY_REGION_AREA_SQ_METERS, ReportResult } from "../_config";
import { ReportSketchMetric, ExtendedSketchMetric } from "../metrics/types";
import { iucnCategories, levels } from "../util/iucnProtectionLevel";
import {
  getCategoryNameForSketches,
  getLevelNameForSketches,
} from "../util/iucnHelpers";
import { overlapAreaGroupMetrics } from "../metrics/overlapGroupMetrics";

const REPORT_ID = "protection";
const METRIC_ID = "area";

/**
 * Calculates area of overlap between each sketch/collection and eez.
 * Also includes group metrics for both IUCN protection level and category
 * @param sketch single sketch or sketch collection
 * @returns metrics
 */
export async function protection(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<ReportResult> {
  const sketches = toSketchArray(sketch);

  const classMetrics = (
    await overlapArea(METRIC_ID, sketch, STUDY_REGION_AREA_SQ_METERS, false)
  ).map(
    (metrics): ReportSketchMetric => ({
      reportId: REPORT_ID,
      classId: "eez",
      ...metrics,
    })
  );

  // category - group metrics
  const sketchCategoryMap = getCategoryNameForSketches(sketches);
  const metricToCategory = (sketchMetric: ExtendedSketchMetric) =>
    sketchCategoryMap[sketchMetric.sketchId];

  const categoryMetrics = (
    await overlapAreaGroupMetrics({
      metricId: METRIC_ID,
      groupIds: Object.keys(iucnCategories),
      sketch,
      metricToGroup: metricToCategory,
      metrics: classMetrics,
      classId: "eez",
      outerArea: STUDY_REGION_AREA_SQ_METERS,
      onlyPresentGroups: true,
    })
  ).map(
    (gm): ReportSketchMetric => ({
      reportId: REPORT_ID,
      ...gm,
    })
  );

  // protection level - group metrics
  const sketchLevelMap = getLevelNameForSketches(sketches);
  const metricToLevel = (sketchMetric: ExtendedSketchMetric) =>
    sketchLevelMap[sketchMetric.sketchId];

  const levelMetrics = (
    await overlapAreaGroupMetrics({
      metricId: METRIC_ID,
      groupIds: levels,
      sketch,
      metricToGroup: metricToLevel,
      metrics: classMetrics,
      classId: "eez",
      outerArea: STUDY_REGION_AREA_SQ_METERS,
    })
  ).map(
    (gm): ReportSketchMetric => ({
      reportId: REPORT_ID,
      ...gm,
    })
  );

  return {
    metrics: [...classMetrics, ...categoryMetrics, ...levelMetrics],
    sketch: toNullSketch(sketch, true),
  };
}

export default new GeoprocessingHandler(protection, {
  title: "protection",
  description: "Calculates IUCN protection levels",
  timeout: 120, // seconds
  executionMode: "async",
  memory: 4096,
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
});
