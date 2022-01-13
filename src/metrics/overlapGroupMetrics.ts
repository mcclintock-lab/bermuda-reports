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
import cloneDeep from "lodash/cloneDeep";

/**
 * Given area overlap metrics stratified by class and sketch, returns new metrics also stratified by group
 * Assumes a sketch is member of only one group, determined by caller-provided metricToGroup
 * For each group+class, calculates area of overlap between sketches in group and featuresByClass (with overlap between group sketches removed first)
 * Types of metrics returned:
 *  copy of caller-provided sketch metrics with addition of group ID
 *  metrics for each group+class, removing overlap between sketches and overlap with higher group sketches (lower index in groupIds)
 * If a group has no sketches in it, then no group metrics will be included for that group, and group+class metric will be 0
 */
export async function overlapGroupMetrics(
  /** Caller-provided metric ID */
  metricId: string,
  /** Group identifiers */
  groupIds: string[],
  /** Sketch - single or collection */
  sketch: Sketch<Polygon> | SketchCollection<Polygon>,
  /** Function that given sketch metric and group name, returns true if sketch is in the group, otherwise false */
  metricToGroup: (sketchMetric: ExtendedSketchMetric) => string,
  /** The metrics to group */
  metrics: ExtendedSketchMetric[],
  /** features to overlap, keyed by class ID */
  featuresByClass: Record<string, Feature<Polygon>[]>
): Promise<GroupSketchMetric[]> {
  const classes = Object.keys(featuresByClass);

  // Filter to individual sketch metrics and clone as base for group metrics
  const sketchMetrics = isSketchCollection(sketch)
    ? cloneDeep(metrics).filter((sm) => sm.sketchId !== sketch.properties.id)
    : cloneDeep(metrics).filter((sm) => sm.sketchId === sketch.properties.id);

  // Lookup group for each metric and convert to stronger typed GroupSketchMetric
  let groupSketchMetrics: GroupSketchMetric[] = metrics.map((m) => ({
    groupId: metricToGroup(m),
    ...m,
  }));

  // For each group
  const groupMetricsPromises = groupIds.reduce<Promise<GroupSketchMetric[]>[]>(
    (groupMetricsPromisesSoFar, curGroup) => {
      // For each class
      const groupMetricsPromise = classes.reduce<
        Promise<GroupSketchMetric[]>[]
      >((classMetricsPromisesSoFar, curClass) => {
        // async iife to wrap in new promise
        const curClassMetricsPromise = (async () => {
          // Generate group metrics for single class
          const classGroupMetrics = await getClassGroupMetrics(
            sketch,
            groupSketchMetrics.filter(
              (sm) => sm.classId === curClass && sm.metricId === metricId
            ),
            groupIds,
            curGroup,
            metricId,
            featuresByClass[curClass]
          );

          return classGroupMetrics.map(
            (metric): GroupSketchMetric => ({
              classId: curClass,
              ...metric,
            })
          );
        })();

        return [...classMetricsPromisesSoFar, curClassMetricsPromise];
      }, []);
      return [...groupMetricsPromisesSoFar, ...groupMetricsPromise];
    },
    []
  );

  // Await and unroll result
  const groupMetrics = (await Promise.all(groupMetricsPromises)).reduce(
    (metricsSoFar, curMetrics) => [...metricsSoFar, ...curMetrics],
    []
  );

  return groupMetrics;
}

/**
 * Given groupId, returns area of overlap between features and sketches in the group
 * Assumes that groupSketchMetrics and features are pre-filtered to a single class
 */
const getClassGroupMetrics = async (
  sketch: Sketch<Polygon> | SketchCollection<Polygon>,
  groupSketchMetrics: GroupSketchMetric[],
  groups: string[],
  groupId: string,
  metricId: string,
  features: Feature<Polygon>[]
): Promise<GroupSketchMetric[]> => {
  const sketches = toSketchArray(sketch);
  const sketchMap = keyBy(sketches, (item) => item.properties.id);

  // Filter to group.  May result in empty list
  const curGroupSketchMetrics: GroupSketchMetric[] = groupSketchMetrics.filter(
    (m) => m.groupId === groupId
  );
  const results: GroupSketchMetric[] = curGroupSketchMetrics;

  // If collection account for overlap
  if (isSketchCollection(sketch)) {
    // Get IDs of all sketches (non-collection) with current group and collection, from metrics
    const curGroupSketches = curGroupSketchMetrics
      .filter((gm) => gm.groupId === groupId)
      .map((gm) => sketchMap[gm.sketchId]) // sketchMap will be undefined for collection metrics
      .filter((gm) => !!gm); // so remove undefined

    // Get sketch metrics from higher groups (lower index value) and convert to sketches
    const otherGroupSketchMetrics = groups.reduce<GroupSketchMetric[]>(
      (otherSoFar, otherGroupName) => {
        // Append if lower index than current group
        const groupIndex = groups.findIndex((grp) => grp === groupId);
        const otherIndex = groups.findIndex(
          (findGroupName) => otherGroupName === findGroupName
        );

        const otherGroupMetrics = groupSketchMetrics.filter(
          (gm) => gm.groupId === otherGroupName
        );
        return otherIndex < groupIndex
          ? otherSoFar.concat(otherGroupMetrics)
          : otherSoFar;
      },
      []
    );
    const otherGroupSketches = Object.values(
      keyBy(otherGroupSketchMetrics, (m) => m.sketchId)
    ).map((ogm) => sketchMap[ogm.sketchId]);

    let groupValue: number = 0;
    if (curGroupSketches.length > 1 || otherGroupSketches.length > 0) {
      groupValue = await getReducedGroupAreaOverlap(
        metricId,
        curGroupSketches,
        otherGroupSketches,
        features
      );
    } else {
      groupValue = curGroupSketchMetrics.reduce(
        (sumSoFar, sm) => sm.value + sumSoFar,
        0
      );
    }

    results.push({
      groupId: groupId,
      metricId: metricId,
      sketchId: sketch.properties.id,
      value: groupValue,
      extra: {
        sketchName: sketch.properties.name,
        isCollection: true,
      },
    });
  }

  // If no single sketch metrics for group, add a zero for group
  if (curGroupSketchMetrics.length === 0) {
    results.push({
      groupId: groupId,
      metricId: metricId,
      sketchId: sketch.properties.id,
      value: 0,
      extra: {
        sketchName: sketch.properties.name,
      },
    });
  }

  return results;
};

/**
 * Calculates area of overlap between groupSketches and features
 * Removes overlap with higherGroupSketches first
 * If either sketch array is empty it will do the right thing
 */
const getReducedGroupAreaOverlap = async (
  /** metric identifier */
  metricId: string,
  /** sketches in group. */
  groupSketches: Sketch<Polygon>[],
  /** sketches in other groups that take precedence and overlap must be removed.  */
  higherGroupSketches: Sketch<Polygon>[],
  /** polygon features to overlap with */
  features: Feature<Polygon>[]
) => {
  // Given current group sketches, subtract area of sketches in higher groups
  const otherOverlap = groupSketches
    .map((groupSketch) => difference(groupSketch, higherGroupSketches))
    .reduce<Feature<Polygon | MultiPolygon>[]>(
      (rem, diff) => (diff ? rem.concat(diff) : rem),
      []
    );
  const otherRemSketches = genSampleSketchCollection(
    featureCollection(flatten(featureCollection(otherOverlap)).features)
  ).features;

  const finalFC = featureCollection(
    higherGroupSketches.length > 0 ? otherRemSketches : groupSketches
  );
  const finalSC = genSampleSketchCollection(finalFC);

  // Calc just the one overall metric for this group+class
  const overallGroupMetric = await overlapFeatures(
    metricId,
    features,
    finalSC,
    { calcSketchMetrics: false }
  );
  return overallGroupMetric[0].value;
};
