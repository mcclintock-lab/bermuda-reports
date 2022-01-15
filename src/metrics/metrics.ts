import { SimpleMetric, ReportSketchMetric } from "./types";

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
