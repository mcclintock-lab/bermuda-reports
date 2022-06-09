import {
  Feature,
  GeoprocessingHandler,
  Metric,
  Polygon,
  ReportResult,
  Sketch,
  SketchCollection,
  iucnLevels,
  getIucnLevelNameForSketches,
  toSketchArray,
  toNullSketch,
  overlapFeaturesGroupMetrics,
  overlapFeatures,
  rekeyMetrics,
  sortMetrics,
} from "@seasketch/geoprocessing";
import { fgbFetchAll } from "@seasketch/geoprocessing/dataproviders";
import bbox from "@turf/bbox";
import config from "../_config";

const REPORT = config.habitatNursery;
const METRIC = REPORT.metrics.areaOverlap;

export async function habitatNursery(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<ReportResult> {
  const box = sketch.bbox || bbox(sketch);
  const sketches = toSketchArray(sketch);

  // Class metrics
  const featuresByClass: Record<string, Feature<Polygon>[]> = {};
  const classMetrics: Metric[] = (
    await Promise.all(
      METRIC.classes.map(async (curClass) => {
        featuresByClass[curClass.classId] = await fgbFetchAll(
          `${config.dataBucketUrl}${curClass.filename}`,
          box
        );
        const classFeatures = await overlapFeatures(
          METRIC.metricId,
          featuresByClass[curClass.classId],
          sketch
        );

        // Sum for overall?

        return classFeatures.map(
          (metric): Metric => ({
            ...metric,
            classId: curClass.classId,
          })
        );
      })
    )
  ).reduce(
    // merge
    (metricsSoFar, curClassMetrics) => [...metricsSoFar, ...curClassMetrics],
    []
  );

  // Calculate group metrics - from individual sketch metrics
  const sketchCategoryMap = getIucnLevelNameForSketches(sketches);
  const metricToGroup = (sketchMetric: Metric) =>
    sketchCategoryMap[sketchMetric.sketchId!];

  const groupMetrics = await overlapFeaturesGroupMetrics({
    metricId: METRIC.metricId,
    groupIds: iucnLevels,
    sketch,
    metricToGroup,
    metrics: classMetrics,
    featuresByClass,
  });

  return {
    metrics: sortMetrics(rekeyMetrics([...classMetrics, ...groupMetrics])),
    sketch: toNullSketch(sketch, true),
  };
}

export default new GeoprocessingHandler(habitatNursery, {
  title: "habitatNursery",
  description: "key nursery habitat within sketch",
  timeout: 600, // seconds
  executionMode: "async",
  memory: 10240,
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
});
