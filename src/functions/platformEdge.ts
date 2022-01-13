import {
  Sketch,
  SketchCollection,
  Polygon,
  Feature,
  GeoprocessingHandler,
  fgbFetchAll,
  toSketchArray,
  toNullSketch,
  isSketchCollection,
  keyBy,
} from "@seasketch/geoprocessing";
import { getJsonUserAttribute } from "../util/getJsonUserAttribute";
import bbox from "@turf/bbox";
import config, { ReportResult } from "../_config";
import { overlapFeatures } from "../metrics/overlapFeaturesNext";
import { overlapGroupMetrics } from "../metrics/overlapGroupMetrics";
import { getBreakGroup } from "../util/getBreakGroup";
import { ExtendedSketchMetric, ReportSketchMetric } from "../metrics/types";

const CONFIG = config.platformEdge;
const CLASS = CONFIG.classes[0];
const REPORT_ID = "platformEdge";
const METRIC_ID = "areaOverlap";

export async function platformEdge(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<ReportResult> {
  const sketches = toSketchArray(sketch);
  const sketchesById = keyBy(sketches, (sk) => sk.properties.id);
  const box = sketch.bbox || bbox(sketch);

  const edgeMultiPoly = await fgbFetchAll<Feature<Polygon>>(
    `${config.dataBucketUrl}${CLASS.filename}`,
    box
  );

  // Calc area sketch metrics
  const classMetrics: ReportSketchMetric[] = (
    await overlapFeatures(METRIC_ID, edgeMultiPoly, sketch)
  ).map((sm) => {
    if (isSketchCollection(sketch) && sm.sketchId === sketch.properties.id) {
      return {
        reportId: REPORT_ID,
        classId: CLASS.classId,
        ...sm,
      };
    }

    // Add extra numFishingRestriced and overlap to individual sketches
    const sketchActivities: string[] = getJsonUserAttribute(
      sketchesById[sm.sketchId],
      "ACTIVITIES",
      []
    );
    const numFishingActivities = CONFIG.fishingActivities.reduce(
      (hasFishingSoFar, fishingActivity) =>
        sketchActivities.includes(fishingActivity)
          ? hasFishingSoFar + 1
          : hasFishingSoFar,
      0
    );

    return {
      reportId: REPORT_ID,
      classId: CLASS.classId,
      ...sm,
      extra: {
        ...sm.extra,
        numFishingRestricted:
          CONFIG.fishingActivities.length - numFishingActivities,
        overlapEdge:
          sm.value > 0 &&
          numFishingActivities < CONFIG.fishingActivities.length,
      },
    };
  });

  // Add group metrics

  // Match sketch to first break group where it has at least min number of restricted activities
  // If no overlap then it's always no break
  // Return true if matches current group
  const metricToGroup = (sketchMetric: ExtendedSketchMetric) =>
    getBreakGroup(
      CONFIG.breakMap,
      sketchMetric?.extra?.numFishingRestricted as number,
      sketchMetric?.extra?.overlapEdge as boolean
    );

  const sketchMetrics = (() => {
    if (isSketchCollection(sketch)) {
      return classMetrics.filter((sm) => sm.sketchId !== sketch.properties.id);
    } else {
      return classMetrics.filter((sm) => sm.sketchId === sketch.properties.id);
    }
  })();

  const groupMetrics: ReportSketchMetric[] = (
    await overlapGroupMetrics(
      METRIC_ID,
      Object.keys(CONFIG.breakMap),
      sketch,
      metricToGroup,
      sketchMetrics,
      { [CLASS.classId]: edgeMultiPoly }
    )
  ).map((gm) => ({
    reportId: REPORT_ID,
    ...gm,
  }));

  return {
    metrics: [...classMetrics, ...groupMetrics],
    sketch: toNullSketch(sketch, true),
  };
}

export default new GeoprocessingHandler(platformEdge, {
  title: "platformEdge",
  description: "Calculates area stats",
  timeout: 30, // seconds
  executionMode: "async",
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
});
