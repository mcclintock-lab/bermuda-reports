import {
  ClassMetricsSketch,
  GroupMetricsSketch,
  SimpleMetric,
  SketchMetric,
  ReportSketchMetric,
} from "./types";
import { overlapFeatures } from "../metrics/overlapFeatures";

import {
  difference,
  Sketch,
  Feature,
  Polygon,
  MultiPolygon,
  genSampleSketchCollection,
  keyBy,
} from "@seasketch/geoprocessing";
import flatten from "@turf/flatten";
import { featureCollection } from "@turf/helpers";

/**
 * Sorts metrics by reportId, then metricId, classId, sketchId.
 * Use to produce consistent metric data that is grouped for ease of
 * scanning for accuracy
 */
export const metricSort = (metrics: ReportSketchMetric[]) => {
  return metrics.sort(
    (a, b) =>
      a.reportId.localeCompare(b.reportId) ||
      a.metricId.localeCompare(b.metricId) ||
      a.classId?.localeCompare(b?.classId || "missing") ||
      a.sketchId.localeCompare(b.sketchId)
  );
};

/**
 * Returns new sketchMetrics array with first sketchMetric matched set with new value.
 * If no match, returns copy of sketchMetrics.  Does not mutate array in place.
 */
export const findAndUpdateMetricValue = <T extends SimpleMetric>(
  sketchMetrics: T[],
  matcher: (sk: T) => boolean,
  value: number
) => {
  const index = sketchMetrics.findIndex(matcher);
  if (index === -1) {
    return [...sketchMetrics];
  } else {
    return [
      ...sketchMetrics.slice(0, index),
      {
        ...sketchMetrics[index],
        value,
      },
      ...sketchMetrics.slice(index + 1),
    ];
  }
};

/**
 * Given ClassMetricsSketch, identifies group for each sketch and reaggregates
 * @deprecated
 */
export const getGroupMetrics = <T extends SketchMetric>(
  groups: string[],
  sketches: Sketch<Polygon>[],
  sketchMetricsFilter: (sketchMetric: T, curGroup: string) => boolean,
  classMetrics: ClassMetricsSketch,
  classTotals: Record<string, { value: number }>,
  featuresByClass: Record<string, Feature<Polygon>[]>
): GroupMetricsSketch => {
  const sketchMap = keyBy(sketches, (item) => item.properties.id);

  // For each group
  const groupMetrics = groups.reduce<GroupMetricsSketch>((acc, curGroup) => {
    // For each class metric, get sketch metrics for just this group
    const newBaseMetrics = Object.keys(classMetrics).reduce(
      (acc, curClassMetricName) => {
        const curClassMetric = classMetrics[curClassMetricName];
        const groupSketchMetrics = curClassMetric.sketchMetrics.filter(
          (sketchMetric) => sketchMetricsFilter(sketchMetric as T, curGroup)
        );

        // If no sketch metrics found for this level, return empty
        if (groupSketchMetrics.length === 0) {
          return {
            ...acc,
            [curClassMetricName]: {
              value: 0,
              percValue: 0,
              sketchMetrics: [],
            },
          };
        }

        // Calc the overall stats for this level
        const levelValue = groupSketchMetrics.reduce(
          (sumSoFar, sm) => sm.value + sumSoFar,
          0
        );
        const levelPercValue =
          levelValue / classTotals[curClassMetricName].value;

        return {
          ...acc,
          [curClassMetricName]: {
            value: levelValue,
            percValue: levelPercValue,
            sketchMetrics: groupSketchMetrics,
          },
        };
      },
      {}
    );

    return {
      ...acc,
      [curGroup]: newBaseMetrics,
    };
  }, {});

  // If sketch collection, recalc group overall stats, accounting for overlap
  if (sketches.length > 1) {
    groups.forEach((groupName, groupIndex) => {
      // For each class in group
      Object.keys(groupMetrics[groupName]).forEach(async (className) => {
        // Get sketch metrics for current group and convert to sketches
        const sketchIds = groupMetrics[groupName][className].sketchMetrics.map(
          (sm) => sm.id
        );
        const groupSketches = sketches.filter((sk) =>
          sketchIds.includes(sk.properties.id)
        );

        // Get sketch metrics from higher groups (lower index value) and convert to sketches
        const otherGroupSketchMetrics = groups.reduce<SketchMetric[]>(
          (otherSketchStats, otherGroupName) => {
            // Append if lower index than current group
            const otherIndex = groups.findIndex(
              (findGroupName) => otherGroupName === findGroupName
            );
            return otherIndex < groupIndex
              ? otherSketchStats.concat(
                  groupMetrics[otherGroupName][className].sketchMetrics
                )
              : otherSketchStats;
          },
          []
        );
        const otherGroupSketches = otherGroupSketchMetrics.map(
          (stat) => sketchMap[stat.id]
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

          // Choose final sketch features
          const finalFeatures =
            otherGroupSketches.length > 0 ? otherRemSketches : groupSketches;

          const groupOverallMetric = await overlapFeatures(
            featuresByClass[className],
            className,
            finalFeatures,
            classTotals[className].value,
            { calcSketchMetrics: false }
          );
          groupMetrics[groupName][className].value = groupOverallMetric.value;
          groupMetrics[groupName][className].percValue =
            groupOverallMetric.percValue;
        }
      });
    });
  }

  return groupMetrics;
};
