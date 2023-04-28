import {
  GeoprocessingHandler,
  Metric,
  Polygon,
  ReportResult,
  Sketch,
  SketchCollection,
  iucnCategoryNames,
  iucnLevels,
  getIucnCategoryNameForSketches,
  getIucnLevelNameForSketches,
  overlapArea,
  overlapAreaGroupMetrics,
  rekeyMetrics,
  sortMetrics,
  toSketchArray,
  toNullSketch,
} from "@seasketch/geoprocessing";
import config, { STUDY_REGION_AREA_SQ_METERS } from "../_config";

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
  const sketchCategoryMap = getIucnCategoryNameForSketches(sketches);
  const metricToCategory = (sketchMetric: Metric) =>
    sketchCategoryMap[sketchMetric.sketchId!];

  const categoryMetrics = await overlapAreaGroupMetrics({
    metricId: METRIC.metricId,
    groupIds: iucnCategoryNames,
    sketch,
    metricToGroup: metricToCategory,
    metrics: classMetrics,
    classId: "eez",
    outerArea: STUDY_REGION_AREA_SQ_METERS,
    onlyPresentGroups: true,
  });

  // protection level - group metrics
  const sketchLevelMap = getIucnLevelNameForSketches(sketches);
  const metricToLevel = (sketchMetric: Metric) =>
    sketchLevelMap[sketchMetric.sketchId!];

  const levelMetrics = await overlapAreaGroupMetrics({
    metricId: METRIC.metricId,
    groupIds: iucnLevels,
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
  timeout: 900, // seconds
  executionMode: "async",
  memory: 10240,
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
});
