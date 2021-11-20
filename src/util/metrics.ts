import {
  ClassMetricsSketch,
  GroupMetricsSketch,
  GroupMetricSketchAgg,
  SketchMetric,
} from "./types";

/**
 * Given ClassMetricsSketch, identifies group for each sketch and reaggregates
 * Does not account for overlap!
 */
export function getGroupMetrics<T extends SketchMetric>(
  groups: string[],
  sketchFilter: (sketchMetric: T, curGroup: string) => boolean,
  classMetrics: ClassMetricsSketch,
  totalValue: number
): GroupMetricsSketch {
  // For each group
  const groupMetrics = groups.reduce<GroupMetricsSketch>((acc, curGroup) => {
    // For each class metric, get sketch metrics for just this group
    const newBaseMetrics = Object.keys(classMetrics).reduce(
      (acc, curClassMetricName) => {
        const curClassMetric = classMetrics[curClassMetricName];
        const groupSketchMetrics = curClassMetric.sketchMetrics.filter(
          (sketchMetric) => sketchFilter(sketchMetric as T, curGroup)
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
        const levelPercValue = levelValue / totalValue;

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
  return groupMetrics;
}

/**
 * Build agg group objects with groupId, percValue for each class, and total percValue across classes per group
 */
export const getGroupMetricsAgg = (
  groupData: GroupMetricsSketch,
  totalValue: number
) => {
  return Object.keys(groupData).map((groupName) => {
    const levelClassMetrics = groupData[groupName];
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
 * Build agg sketch objects with groupId, sketchId, sketchName, percValue for each class, and total percValue across classes per sketch
 * @param groupData
 * @param totalValue
 * @param classes
 * @returns
 */
export const getGroupMetricsSketchAgg = (
  groupData: GroupMetricsSketch,
  totalValue: number,
  classes: Array<{
    filename: string;
    baseFilename: string;
    display: string;
    layerId: string;
  }>
) => {
  // For each group
  let sketchRows: GroupMetricSketchAgg[] = [];
  Object.keys(groupData).forEach((groupId) => {
    const classMetrics = groupData[groupId];
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

// /**
//  * Build agg sketch objects with groupId, sketchId, sketchName, percValue for each class, and total percValue across classes per sketch
//  * @param groupData
//  * @param totalValue
//  * @param classes
//  * @returns
//  */
//  export const getClassAgg = (
//   groupData: ClassMetricsSketch,
//   totalValue: number,
//   classes: Array<{
//     filename: string;
//     baseFilename: string;
//     display: string;
//     layerId: string;
//   }>
// ) => {
//   // For each group
//   let sketchRows: GroupMetricSketchAgg[] = [];
//   Object.keys(groupData).forEach((groupId) => {
//     const classMetrics = groupData[groupId];
//     // Inspect first class to get list of sketches in this group
//     const sketchesInGroup = Object.values(
//       classMetrics
//     )[0].sketchMetrics.map((sm) => ({ id: sm.id, name: sm.name }));

//     // For each sketch
//     sketchesInGroup.forEach((sketchInGroup) => {
//       // Build up agg percValue for each class
//       const classAgg = classes.reduce<Record<string, number>>(
//         (classAggSoFar, lyr) => {
//           const groupSketchMetrics = keyBy(
//             classMetrics[lyr.baseFilename].sketchMetrics,
//             (sm) => sm.id
//           );
//           return {
//             ...classAggSoFar,
//             value:
//               classAggSoFar.value + groupSketchMetrics[sketchInGroup.id].value,
//             [lyr.baseFilename]: groupSketchMetrics[sketchInGroup.id].percValue,
//           };
//         },
//         { value: 0 }
//       );

//       sketchRows.push({
//         groupId,
//         sketchId: sketchInGroup.id,
//         sketchName: sketchInGroup.name,
//         percValue: classAgg.value / totalValue,
//         ...classAgg,
//       });
//     });
//   });
//   return sketchRows;
// };
