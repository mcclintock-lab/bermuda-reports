/**
 * Represents a single class of data within a report.
 * Used to access the data, calculate and report metrics based on them.
 */
export interface DataClass {
  /** Unique name for class */
  name: string;
  /** Name of class suitable for user display */
  display: string;
  /** Optional filename of dataset used for metric class, sans extension. */
  baseFilename?: string;
  /** Optional filename of dataset for metric class for use by GP function, with extension. */
  filename?: string;
  /** Optional unique integer used by raster datasets to represent class */
  classId?: string;
  /** Optional ID of map layer associated with this class */
  layerId?: string;
  /** Optional nodata value used by raster dataset */
  noDataValue?: number;
  /** Optional project specific goal for this class */
  goalPerc?: number;
}

/**
 * Represents a group of data classes.
 * Used to access the data, calculate and report metrics based on them.
 * This interface is murky but it supports a variety of scenarios:
 * - Vector dataset with one feature class
 * - Vector dataset with multiple feature class, each with their own file datasource, and possibly only one layerId to display them all
 * - Vector dataset with multiple feature classes, all in one file datasource, each class with its own layerId
 * - Raster with multiple feature classes represented by unique integer values that map to class names
 */
export interface DataGroup {
  /** data classes used by report group */
  classes: DataClass[];
  /** Optional filename of dataset, sans extension. May contain data for one or more classes */
  baseFilename?: string;
  /** Optional filename of dataset for use by GP function, with extension */
  filename?: string;
  /** Optional ID of map layer associated with this metric */
  layerId?: string;
  /** Optional mapping of class integer ID to its name */
  classIdToName?: Record<string, string>;
}

/** Single value metric */
export interface SimpleMetric {
  /** Name of the metric */
  metricId: string;
  /** The metric value */
  value: number;
  /** Additional ad-hoc properties, often used to ease interpretation */
  extra?: Record<string, string | number | boolean>;
}

/** Metric with specific additional properties for stratification */
export interface ExtendedMetric extends SimpleMetric {
  /** Optional, if metric is for specific classification - typically data class */
  classId?: string;
  /** Optional. if metric is for specific group - e.g. protection level*/
  groupId?: string;
  /** Optional, if metric is for specfic geography */
  geographyId?: string;
}

/**
 * Metric for a single sketch
 */
export interface SimpleSketchMetric extends SimpleMetric {
  /** ID of sketch or sketch collection the metric is calculated for. */
  sketchId: string;
}

/**
 * Metric for a single sketch with additional properties supporting stratification.
 * ToDo: can this just extend MetricBase also?
 */
export type ExtendedSketchMetric = SimpleSketchMetric & ExtendedMetric;

//// DEPRECATED ////

/**
 * Properties for representing metric value and perc value, such as area or sum
 * ValueMetric is the core metric representation. It can related to a class of data or a sketch
 */
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
 * Single flattened metric with class values keyed by class name
 * Useful for rendering table rows with the values of multiple classes for a group
 */
export interface ClassMetricAgg {
  value: number;
  percValue: number;
  [className: string]: string | number;
}

export type ClassMetricSketchAgg = ClassMetricAgg & {
  sketchId: string;
  sketchName: string;
};

/**
 * Single flattened metric with class values keyed by class name
 * Useful for rendering table rows with the values of multiple classes for a group
 */

export type GroupMetricAgg = {
  groupId: string;
  value: number;
  percValue: number;
  [className: string]: string | number;
};

export type GroupMetricSketchAgg = GroupMetricAgg & {
  sketchId: string;
  sketchName: string;
};

// Deprecated

export interface SketchStat {
  sketchId: string;
  name: string;
  // category stats
  category: string;
  level: string;
  // area stats
  area: number;
  percPlanningArea: number;
}

export interface CategoryStat {
  category: string;
  level: string;
  numSketches: number;
  area: number;
  percPlanningArea: number;
}

export interface LevelStat {
  level: string;
  numSketches: number;
  area: number;
  percPlanningArea: number;
}
