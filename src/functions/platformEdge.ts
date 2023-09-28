import {
  ReportResult,
  Sketch,
  SketchCollection,
  Polygon,
  Feature,
  Metric,
  GeoprocessingHandler,
  getJsonUserAttribute,
  toSketchArray,
  toNullSketch,
  isSketchCollection,
  keyBy,
  overlapFeaturesGroupMetrics,
  rekeyMetrics,
  sortMetrics,
} from "@seasketch/geoprocessing";
import { fgbFetchAll } from "@seasketch/geoprocessing/dataproviders";
import bbox from "@turf/bbox";
import config from "../_config";
import { getBreakGroup } from "../util/getBreakGroup";
import { overlapFeatures } from "../util/overlapFeatures";

const REPORT = config.platformEdge;
const METRIC = REPORT.metrics.areaOverlap;
const CLASS = METRIC.classes[0];

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
  const classMetrics: Metric[] = (
    await overlapFeatures(METRIC.metricId, edgeMultiPoly, sketch)
  ).map((sm) => {
    if (isSketchCollection(sketch) && sm.sketchId === sketch.properties.id) {
      return {
        ...sm,
        classId: CLASS.classId,
      };
    }

    // Add extra numFishingRestriced and overlap to individual sketches
    const sketchActivities: string[] = getJsonUserAttribute(
      sketchesById[sm.sketchId!],
      "ACTIVITIES",
      []
    );
    const numFishingActivities = METRIC.fishingActivities.reduce(
      (hasFishingSoFar, fishingActivity) =>
        sketchActivities.includes(fishingActivity)
          ? hasFishingSoFar + 1
          : hasFishingSoFar,
      0
    );

    return {
      ...sm,
      classId: CLASS.classId,
      extra: {
        ...sm.extra,
        numFishingRestricted:
          METRIC.fishingActivities.length - numFishingActivities,
        overlapEdge:
          sm.value > 0 &&
          numFishingActivities < METRIC.fishingActivities.length,
      },
    };
  });

  // Add group metrics

  // Match sketch to first break group where it has at least min number of restricted activities
  // If no overlap then it's always no break
  // Return true if matches current group
  const metricToGroup = (sketchMetric: Metric) =>
    getBreakGroup(
      METRIC.breakMap,
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

  const groupMetrics: Metric[] = await overlapFeaturesGroupMetrics({
    metricId: METRIC.metricId,
    groupIds: Object.keys(METRIC.breakMap),
    sketch,
    metricToGroup,
    metrics: sketchMetrics,
    featuresByClass: { [CLASS.classId]: edgeMultiPoly },
  });

  return {
    metrics: sortMetrics(rekeyMetrics([...classMetrics, ...groupMetrics])),
    sketch: toNullSketch(sketch, true),
  };
}

export default new GeoprocessingHandler(platformEdge, {
  title: "platformEdge",
  description: "Calculates area stats",
  timeout: 900, // seconds
  memory: 10240,
  executionMode: "async",
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
});
