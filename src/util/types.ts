// ValueMetric is the core metric representation
// It can related to a class of data or a sketch
//

/** Properties for representing metric value and perc value, such as area or sum */
export interface ValueMetric {
  /** The raw metric value, the heart of it all */
  value: number;
  /** Proportion of value to total value, so common its included */
  percValue: number;
}

/** ValueMetric for a sketch */
export type SketchMetric = ValueMetric & {
  id: string;
  name: string;
};

/**
 * ValueMetric for a named class of data
 */
export type ClassMetric = ValueMetric & {
  /** Name of class */
  name: string;
};

/**
 * ValueMetric for a named class of data, with additional per-sketch
 */
export type ClassMetricSketch = ClassMetric & {
  sketchMetrics: SketchMetric[];
};

/**
 * Object containing a ValueMetric for one or more named class of data
 */
export interface ClassMetrics {
  [name: string]: ClassMetric;
}

/**
 * Object containing a ValueMetric for one or more named class of data, with additional per-sketch
 */
export interface ClassMetricsSketch {
  [name: string]: ClassMetricSketch;
}

// GroupMetrics have named ClassMetrics

/**
 * Object containing one or more named groups, each with one or more named ClassMetric
 * Useful for larger groupings of classes e.g. protection categories and levels
 */
export interface GroupMetrics {
  [name: string]: ClassMetrics;
}

/**
 * Object containing one or more named groups, each with one or more named ClassMetric, with additional per-sketch
 * Useful for larger groupings of classes e.g. protection categories and levels
 */
export interface GroupMetricsSketch {
  [name: string]: ClassMetricsSketch;
}

//// AGGREGATIONS ////

/**
 * Flattened metric with class values keyed by class name
 * Useful for rendering table rows with the values of multiple classes for a group
 */
export interface ClassMetricAgg {
  // Add value too?
  percValue: number;
  [className: string]: string | number;
}

export type ClassMetricSketchAgg = ClassMetricAgg & {
  sketchId: string;
  sketchName: string;
};

/**
 * Flattened metric with class values keyed by class name
 * Useful for rendering table rows with the values of multiple classes for a group
 */

export type GroupMetricAgg = {
  groupId: string;
  // Add value too?
  percValue: number;
  [className: string]: string | number;
};

export type GroupMetricSketchAgg = GroupMetricAgg & {
  sketchId: string;
  sketchName: string;
};
