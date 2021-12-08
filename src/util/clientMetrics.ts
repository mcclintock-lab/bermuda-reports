import {
  ClassMetricSketchAgg,
  GroupMetricsSketch,
  GroupMetricSketchAgg,
  SketchMetric,
  ClassMetricsSketch,
} from "./types";

/**
 * Flattens group metrics into an array of objects, one for each group.
 * Each object includes the count of sketches in the group and total percValue across classes
 * @param groupMetrics - group metric data
 * @param totalValue  - total value with classes combined
 * @returns
 */
export const flattenGroup = (
  groupMetrics: GroupMetricsSketch,
  totalValue: number
): {
  value: number;
  groupId: string;
  percValue: number;
}[] => {
  return Object.keys(groupMetrics).map((groupName) => {
    const levelClassMetrics = groupMetrics[groupName];
    const classAgg = Object.keys(levelClassMetrics).reduce(
      (rowSoFar, className) => ({
        ...rowSoFar,
        [className]: levelClassMetrics[className].percValue,
        numSketches: levelClassMetrics[className].sketchMetrics.length,
        value: rowSoFar.value + levelClassMetrics[className].value,
      }),
      { value: 0 }
    );
    return {
      groupId: groupName,
      percValue: classAgg.value / totalValue,
      ...classAgg,
    };
  });
};

/**
 * Flattens group metrics into an array of objects, one for each group sketch.
 * Each object includes the percValue for each class, and the total percValue with classes combined
 * @param groupMetrics - group metric data
 * @param totalValue - total value with classes combined
 * @param classes - class config
 * @returns
 */
export const flattenGroupSketch = (
  groupMetrics: GroupMetricsSketch,
  totalValue: number,
  classes: Array<{
    filename: string;
    baseFilename: string;
    display: string;
    layerId: string;
  }>
): GroupMetricSketchAgg[] => {
  // For each group
  let sketchRows: GroupMetricSketchAgg[] = [];
  Object.keys(groupMetrics).forEach((groupId) => {
    const classMetrics = groupMetrics[groupId];
    // Inspect first class to get list of sketches in this group
    const sketchesInGroup = Object.values(
      classMetrics
    )[0].sketchMetrics.map((sm) => ({ id: sm.id, name: sm.name }));

    // For each sketch
    sketchesInGroup.forEach((sketchInGroup) => {
      // Build up agg percValue for each class
      const classAgg = classes.reduce<Record<string, number>>(
        (classAggSoFar, lyr) => {
          const groupSketchMetrics = classMetrics[
            lyr.baseFilename
          ].sketchMetrics.reduce<Record<string, SketchMetric>>(
            (soFar, sm) => ({ ...soFar, [sm.id]: sm }),
            {}
          );
          return {
            ...classAggSoFar,
            value:
              classAggSoFar.value + groupSketchMetrics[sketchInGroup.id].value,
            [lyr.baseFilename]: groupSketchMetrics[sketchInGroup.id].percValue,
          };
        },
        { value: 0 }
      );

      sketchRows.push({
        groupId,
        sketchId: sketchInGroup.id,
        sketchName: sketchInGroup.name,
        percValue: classAgg.value / totalValue,
        ...classAgg,
      });
    });
  });
  return sketchRows;
};

/**
 * Flattens class sketch metrics into an array of simple objects
 * No extra properties are computed
 * @param classMetrics - class metric data with sketch
 * @param classes
 * @returns
 */
export const flattenClassSketch = (
  classMetrics: ClassMetricsSketch,
  classes: Array<{
    filename: string;
    baseFilename: string;
    display: string;
    layerId: string;
  }>
) => {
  // Inspect first class to get list of sketches
  const sketches = Object.values(classMetrics)[0].sketchMetrics.map((sm) => ({
    id: sm.id,
    name: sm.name,
  }));

  let sketchRows: ClassMetricSketchAgg[] = [];
  sketches.forEach((curSketch) => {
    classes.forEach((curClass) => {
      // sketchMetrics keyBy id.  Avoid importing keyBy from gp package for client use
      const sketchMetricsById = classMetrics[
        curClass.baseFilename
      ].sketchMetrics.reduce<Record<string, SketchMetric>>(
        (soFar, sm) => ({ ...soFar, [sm.id]: sm }),
        {}
      );
      const curMetric = sketchMetricsById[curSketch.id];
      sketchRows.push({
        sketchId: curMetric.id,
        sketchName: curMetric.name,
        value: curMetric.value,
        percValue: curMetric.percValue,
      });
    });
  });
  return sketchRows;
};

/**
 * Flattens class sketch metrics into array of sketch objects, where each object contains all metric values keyed by class
 * @param classMetrics - class metric data with sketch
 * @param classes
 * @returns
 */
export const flattenSketchAllClass = (
  classMetrics: ClassMetricsSketch,
  classes: Array<{
    filename: string;
    baseFilename: string;
    display: string;
    layerId: string;
  }>
) => {
  // Inspect first class to get list of sketches
  const sketches = Object.values(classMetrics)[0].sketchMetrics.map((sm) => ({
    id: sm.id,
    name: sm.name,
  }));

  let sketchRows: Record<string, string | number>[] = [];
  sketches.forEach((curSketch) => {
    const classMetricAgg = classes.reduce<Record<string, number>>(
      (aggSoFar, curClass) => {
        // sketchMetrics keyBy id.  Avoid importing keyBy from gp package for client use
        const sketchMetricsById = classMetrics[
          curClass.baseFilename
        ].sketchMetrics.reduce<Record<string, SketchMetric>>(
          (soFar, sm) => ({ ...soFar, [sm.id]: sm }),
          {}
        );
        return {
          ...aggSoFar,
          ...{
            [curClass.baseFilename]: sketchMetricsById[curSketch.id].percValue,
          },
        };
      },
      {}
    );
    sketchRows.push({
      sketchId: curSketch.id,
      sketchName: curSketch.name,
      ...classMetricAgg,
    });
  });
  return sketchRows;
};
