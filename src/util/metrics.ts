import {
  ClassMetricsSketch,
  GroupMetricsSketch,
  GroupMetricSketchAgg,
} from "./types";
import { keyBy } from "@seasketch/geoprocessing/client";

/**
 * Build agg group objects with groupId, percValue for each class, and total percValue across classes per group
 */
export const getGroupAgg = (
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
export const getSketchAgg = (
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
          const groupSketchMetrics = keyBy(
            classMetrics[lyr.baseFilename].sketchMetrics,
            (sm) => sm.id
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
