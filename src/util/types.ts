/** Properties for representing metric value and perc value, such as area or sum */
export interface ValueMetric {
  /** Value from map */
  value: number;
  /** Proportion of value to total value */
  percValue: number;
}

/** Properties for representing metric sub group/category */
export interface SubMetric {
  id: string;
  name: string;
}

/** Combined ValueMetric with sketch identifiers */
export type SketchMetric = SubMetric & ValueMetric;

/** Metric calculated per class, including per-sketch SubMetric */
export type ClassMetric = ValueMetric & {
  /** Name of class */
  name: string;
  sketchMetrics: SketchMetric[];
};

export interface ClassMetrics {
  [name: string]: ClassMetric;
}
