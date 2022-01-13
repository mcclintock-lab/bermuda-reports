import {
  Sketch,
  SketchCollection,
  GeoprocessingHandler,
  Feature,
  Polygon,
  fgbFetchAll,
  toSketchArray,
  toNullSketch,
} from "@seasketch/geoprocessing";
import bbox from "@turf/bbox";
import config, { ReportResult } from "../_config";
import { levels } from "../util/iucnProtectionLevel";
import { getLevelNameForSketches } from "../util/iucnHelpers";
import { ExtendedSketchMetric, ReportSketchMetric } from "../metrics/types";

import { overlapGroupMetrics } from "../metrics/overlapGroupMetrics";
import { overlapFeatures } from "../metrics/overlapFeaturesNext";

const CONFIG = config.habitatNursery;
const REPORT_ID = "habitatNursery";
const METRIC_ID = "areaOverlap";

export async function habitatNursery(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<ReportResult> {
  const box = sketch.bbox || bbox(sketch);
  const sketches = toSketchArray(sketch);

  // Class metrics
  const featuresByClass: Record<string, Feature<Polygon>[]> = {};
  const classMetrics: ReportSketchMetric[] = (
    await Promise.all(
      CONFIG.classes.map(async (curClass) => {
        featuresByClass[curClass.classId] = await fgbFetchAll(
          `${config.dataBucketUrl}${curClass.filename}`,
          box
        );
        const classFeatures = await overlapFeatures(
          METRIC_ID,
          featuresByClass[curClass.classId],
          sketch
        );

        // Sum for overall?

        return classFeatures.map(
          (metric): ReportSketchMetric => ({
            reportId: REPORT_ID,
            classId: curClass.classId,
            ...metric,
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
  const sketchCategoryMap = getLevelNameForSketches(sketches);
  const metricToGroup = (sketchMetric: ExtendedSketchMetric) =>
    sketchCategoryMap[sketchMetric.sketchId];

  const groupMetrics = (
    await overlapGroupMetrics(
      METRIC_ID,
      levels,
      sketch,
      metricToGroup,
      classMetrics,
      featuresByClass
    )
  ).map(
    (gm): ReportSketchMetric => ({
      reportId: REPORT_ID,
      ...gm,
    })
  );

  return {
    metrics: [...classMetrics, ...groupMetrics],
    sketch: toNullSketch(sketch, true),
  };
}

export default new GeoprocessingHandler(habitatNursery, {
  title: "habitatNursery",
  description: "key nursery habitat within sketch",
  timeout: 180, // seconds
  executionMode: "async",
  memory: 8192,
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
});
