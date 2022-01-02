import { ExtendedSketchMetric, GroupSketchMetric } from "./types";
import { overlapFeatures } from "../metrics/overlapFeaturesNext";

import {
  difference,
  Sketch,
  Feature,
  Polygon,
  MultiPolygon,
  genSampleSketchCollection,
  keyBy,
  SketchCollection,
  toSketchArray,
  isSketchCollection,
} from "@seasketch/geoprocessing";
import flatten from "@turf/flatten";
import { featureCollection } from "@turf/helpers";

/**
 * Given sketch metrics, bins them into a group, and calculates area of overlap with features by class.
 * For each group and class, calculates per sketch metrics and an overall group metric.
 * If a group has no sketches in it, then no group sketch metrics will be present, and overall metric will be 0
 */
export async function overlapGroupMetrics<T extends ExtendedSketchMetric>(
  /** Caller-provided metric ID */
  metricId: string,
  /** Group names */
  groups: string[],
  /** Sketch polygons whether from collection or single */
  sketch: Sketch<Polygon> | SketchCollection<Polygon>,
  /** Function that given sketch metric and group name, returns true if sketch is in the group, otherwise false */
  groupFilter: (sketchMetric: T, curGroup: string) => boolean,
  /** The sketch metrics to group */
  sketchMetrics: ExtendedSketchMetric[],
  /** features to overlap, keyed by class ID */
  featuresByClass: Record<string, Feature<Polygon>[]>
): Promise<GroupSketchMetric[]> {
  const sketches = toSketchArray(sketch);
  const classes = Object.keys(featuresByClass);

  // For each group
  const groupMetricPromises = groups.reduce<Promise<GroupSketchMetric[]>[]>(
    (groupMetricsSoFar, curGroup) => {
      // For each class
      const classGroupMetrics = classes.reduce<Promise<GroupSketchMetric[]>[]>(
        (classMetricsSoFar, curClass) => {
          // Get promise of metrics for group+class
          const overallMetric = getClassGroupMetrics({
            sketch,
            sketchMetrics,
            groups,
            curClass,
            curGroup,
            metricId,
            featuresByClass,
            groupFilter,
          });

          return [...classMetricsSoFar, overallMetric];
        },
        []
      );
      return [...groupMetricsSoFar, ...classGroupMetrics];
    },
    []
  );

  // Await and unroll result
  const groupMetrics = (await Promise.all(groupMetricPromises)).reduce(
    (metricsSoFar, curMetrics) => [...metricsSoFar, ...curMetrics],
    []
  );

  return groupMetrics;
}

/**
 * Calculates area of overlap of group with features by class.
 * Single and overall metrics.
 */
const getClassGroupMetrics = async <T extends ExtendedSketchMetric>(options: {
  sketch: Sketch<Polygon> | SketchCollection<Polygon>;
  sketchMetrics: ExtendedSketchMetric[];
  groups: string[];
  curClass: string;
  curGroup: string;
  metricId: string;
  featuresByClass: Record<string, Feature<Polygon>[]>;
  groupFilter: (sketchMetric: T, curGroup: string) => boolean;
}): Promise<GroupSketchMetric[]> => {
  const {
    sketch,
    sketchMetrics,
    groups,
    curClass,
    curGroup,
    metricId,
    featuresByClass,
    groupFilter,
  } = options;

  const sketches = toSketchArray(sketch);
  const sketchMap = keyBy(sketches, (item) => item.properties.id);

  // Find single sketch metrics for current group and turn into group metrics
  const singleMetrics: GroupSketchMetric[] = sketchMetrics
    .filter((sm) => sm.classId === curClass)
    .filter((sketchMetric) => groupFilter(sketchMetric as T, curGroup))
    .map((sm) => ({
      groupId: curGroup,
      ...sm,
      extra: {
        sketchName: sketchMap[sm.sketchId].properties.name,
      },
    }));

  // If collection account for overlap
  if (isSketchCollection(sketch)) {
    const groupValue = await getGroupOverallValue({
      sketch,
      singleMetrics,
      groups,
      curClass,
      curGroup,
      metricId,
      featuresByClass,
    });

    return [
      ...singleMetrics,
      {
        groupId: curGroup,
        classId: curClass,
        metricId: metricId,
        sketchId: sketch.properties.id,
        value: groupValue,
        extra: {
          sketchName: sketch.properties.name,
          isCollection: true,
        },
      },
    ];
  }

  // Fallback to sum of values, will be zero if no single metrics
  const groupValue = singleMetrics.reduce(
    (sumSoFar, sm) => sm.value + sumSoFar,
    0
  );

  return [
    ...singleMetrics,
    {
      groupId: curGroup,
      classId: curClass,
      metricId: metricId,
      sketchId: sketch.properties.id,
      value: groupValue,
      extra: {
        sketchName: sketch.properties.name,
        isCollection: true,
      },
    },
  ];
};

/**
 * Calculates overall area of overlap of group with features by class.  Single and overall metrics.
 */
const getGroupOverallValue = async (options: {
  sketch: Sketch<Polygon> | SketchCollection<Polygon>;
  singleMetrics: GroupSketchMetric[];
  groups: string[];
  curClass: string;
  curGroup: string;
  metricId: string;
  featuresByClass: Record<string, Feature<Polygon>[]>;
}) => {
  const {
    sketch,
    singleMetrics,
    groups,
    curClass,
    curGroup,
    metricId,
    featuresByClass,
  } = options;
  const sketches = toSketchArray(sketch);
  const sketchMap = keyBy(sketches, (item) => item.properties.id);

  // Start with naive group value (sum of single sketches)
  let groupValue = singleMetrics.reduce(
    (sumSoFar, sm) => sm.value + sumSoFar,
    0
  );

  // Reduce group value by removing overlap with higher groups and overlap between sketches within group

  // Get IDs of all sketches (non-collection) with current group and collection, from metrics
  const groupSketches = singleMetrics
    .filter((gm) => gm.groupId === curGroup && gm.classId === curClass)
    .map((gm) => sketchMap[gm.sketchId]) // sketchMap will be undefined for collection metrics
    .filter((gm) => !!gm); // so remove undefined

  // Get sketch metrics from higher groups (lower index value) and convert to sketches
  const otherGroupMetrics = groups.reduce<GroupSketchMetric[]>(
    (otherSoFar, otherGroupName) => {
      // Append if lower index than current group
      const groupIndex = groups.findIndex((grp) => grp === curGroup);
      const otherIndex = groups.findIndex(
        (findGroupName) => otherGroupName === findGroupName
      );
      const otherGroupMetrics = singleMetrics.filter(
        (gm) => gm.groupId === otherGroupName && gm.classId === curClass
      );
      return otherIndex < groupIndex
        ? otherSoFar.concat(otherGroupMetrics)
        : otherSoFar;
    },
    []
  );
  const otherGroupSketches = otherGroupMetrics.map(
    (ogm) => sketchMap[ogm.sketchId]
  );

  // only recalc if more than one sketch in group
  if (groupSketches.length > 1 || otherGroupSketches.length > 0) {
    // Given current group sketches, subtract area of sketches in higher groups
    const otherOverlap = groupSketches
      .map((groupSketch) => difference(groupSketch, otherGroupSketches))
      .reduce<Feature<Polygon | MultiPolygon>[]>(
        (rem, diff) => (diff ? rem.concat(diff) : rem),
        []
      );
    const otherRemSketches = genSampleSketchCollection(
      featureCollection(flatten(featureCollection(otherOverlap)).features)
    ).features;

    const finalCollection = {
      ...sketch,
      features:
        otherGroupSketches.length > 0 ? otherRemSketches : groupSketches,
    };

    // Calc just the one overall metric for this group+class
    const overallGroupMetric = await overlapFeatures(
      metricId,
      featuresByClass[curClass],
      finalCollection,
      { calcSketchMetrics: false }
    );
    groupValue = overallGroupMetric[0].value;
  }

  return groupValue;
};
