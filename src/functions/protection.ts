import {
  Sketch,
  SketchCollection,
  Polygon,
  Metric,
  GeoprocessingHandler,
  toSketchArray,
  toNullSketch,
  overlapArea,
  overlapAreaGroupMetrics,
  rekeyMetrics,
  sortMetrics,
} from "@seasketch/geoprocessing";
import config, { STUDY_REGION_AREA_SQ_METERS, ReportResult } from "../_config";
import { iucnCategories, levels } from "../util/iucnProtectionLevel";
import {
  getCategoryNameForSketches,
  getLevelNameForSketches,
} from "../util/iucnHelpers";

const CONFIG = config;
const REPORT = CONFIG.protection;
const METRIC = REPORT.metrics.areaOverlap;
if (!CONFIG || !REPORT || !METRIC)
  throw new Error("Problem accessing report config");

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
    await overlapArea(METRIC.metricId, sketch, STUDY_REGION_AREA_SQ_METERS, {
      includePercMetric: false,
    })
  ).map(
    (metrics): Metric => ({
      ...metrics,
      classId: "eez",
    })
  );

  // category - group metrics
  const sketchCategoryMap = getCategoryNameForSketches(sketches);
  const metricToCategory = (sketchMetric: Metric) =>
    sketchCategoryMap[sketchMetric.sketchId!];

  const categoryMetrics = await overlapAreaGroupMetrics({
    metricId: METRIC.metricId,
    groupIds: Object.keys(iucnCategories),
    sketch,
    metricToGroup: metricToCategory,
    metrics: classMetrics,
    classId: "eez",
    outerArea: STUDY_REGION_AREA_SQ_METERS,
    onlyPresentGroups: true,
  });

  // protection level - group metrics
  const sketchLevelMap = getLevelNameForSketches(sketches);
  const metricToLevel = (sketchMetric: Metric) =>
    sketchLevelMap[sketchMetric.sketchId!];

  const levelMetrics = await overlapAreaGroupMetrics({
    metricId: METRIC.metricId,
    groupIds: levels,
    sketch,
    metricToGroup: metricToLevel,
    metrics: classMetrics,
    classId: "eez",
    outerArea: STUDY_REGION_AREA_SQ_METERS,
  });

  return {
    metrics: sortMetrics(
      rekeyMetrics([...classMetrics, ...categoryMetrics, ...levelMetrics])
    ),
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
