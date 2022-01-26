import {
  Metric,
  MetricDimension,
  MetricProperties,
  MetricProperty,
} from "./types";

export const createMetric = (metricProps: Partial<Metric>): Metric => {
  return {
    metricId: "metric",
    value: 0,
    classId: null,
    groupId: null,
    geographyId: null,
    sketchId: null,
    ...metricProps,
  };
};

/**
 * Reorders metrics to a consistent key order for readability
 */
export const rekeyMetrics = (
  metrics: Metric[],
  idOrder: MetricProperty[] = [...MetricProperties]
) => {
  return metrics.map((curMetric) => {
    var newMetric: Record<string, any> = {};
    idOrder.forEach((id) => {
      newMetric[id] = curMetric[id];
    });
    return newMetric;
  }) as Metric[];
};

/**
 * Sorts metrics to a consistent order for readability
 * Defaults to [metricId, classId, sketchId]
 */
export const sortMetrics = (
  metrics: Metric[],
  sortIds: MetricDimension[] = ["metricId", "classId", "sketchId"]
) => {
  return metrics.sort((a, b) => {
    return sortIds.reduce((sortResult, idName) => {
      // if sort result alread found then skip
      if (sortResult !== 0) return sortResult;
      const aVal = a[idName];
      const bVal = b[idName];
      if (aVal && bVal) return aVal.localeCompare(bVal);
      return 0;
    }, 0);
  });
};

/**
 * Returns new sketchMetrics array with first sketchMetric matched set with new value.
 * If no match, returns copy of sketchMetrics.  Does not mutate array in place.
 */
export const findAndUpdateMetricValue = <T extends Metric>(
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
