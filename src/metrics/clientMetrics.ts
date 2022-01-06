import {
  ClassMetricSketchAgg,
  GroupMetricsSketch,
  GroupMetricSketchAgg,
  SketchMetric,
  ClassMetricsSketch,
  DataClass,
  ExtendedSketchMetric,
  ExtendedMetric,
  SimpleMetric,
  SimpleSketchMetric,
  MetricIdNames,
  MetricIdTypes,
} from "./types";

import {
  Sketch,
  SketchCollection,
  NullSketch,
  NullSketchCollection,
  isNullSketchCollection,
  isSketch,
  isSketchCollection,
  isNullSketch,
} from "@seasketch/geoprocessing/client-core";
import { groupBy, keyBy } from "@seasketch/geoprocessing/client-core";

import deepCopy from "../util/deepCopy";
import reduce from "lodash/reduce";

/**
 * Helper methods for using metrics in browser client
 */

/**
 * Given sketch collection, returns IDs of sketches in the collection
 */
export const getSketchCollectionChildIds = (
  collection: SketchCollection | NullSketchCollection
) => collection.features.map((sk) => sk.properties.id);

/**
 * Given sketch(es), returns ID(s)
 */
export const sketchToId = (
  sketch: Sketch | NullSketch | Sketch[] | NullSketch[]
) =>
  Array.isArray(sketch)
    ? sketch.map((sk) => sk.properties.id)
    : sketch.properties.id;

/**
 * Returns a shorthand Sketch array given a Sketch or SketchCollection.
 * Includes the collection as a shorthand sketch also
 */
export const toSketchShortAll = (
  input: Sketch | SketchCollection | NullSketch | NullSketchCollection
): { id: string; name: string }[] => {
  if (isSketch(input) || isNullSketch(input)) {
    return [{ id: input.properties.id, name: input.properties.name }];
  } else if (isSketchCollection(input) || isNullSketchCollection(input)) {
    return [
      { id: input.properties.id, name: input.properties.name },
      ...input.features.map((sk) => ({
        id: sk.properties.id,
        name: sk.properties.name,
      })),
    ];
  }
  throw new Error("invalid input, must be Sketch or SketchCollection");
};

/**
 * Returns metrics with matching sketchId (can be an array of sketchids)
 */
export const metricsSketchIds = <M extends SimpleSketchMetric>(metrics: M[]) =>
  Object.keys(groupBy(metrics, (m) => m.sketchId));

/**
 * Returns metrics with matching sketchId (can be an array of sketchids)
 */
export const metricsWithSketchId = <M extends SimpleSketchMetric>(
  metrics: M[],
  sketchId: string | string[]
) =>
  metrics.filter((m) =>
    Array.isArray(sketchId)
      ? sketchId.includes(m.sketchId)
      : sketchId === m.sketchId
  );

/**
 * Returns metrics with matching sketchId (can be an array of sketchids)
 */
export const metricsWithClassId = <M extends ExtendedSketchMetric>(
  metrics: M[],
  classId: string | string[]
) =>
  metrics.filter((m) =>
    Array.isArray(classId)
      ? classId.includes(m.classId || "undefined")
      : classId === m.classId
  );

/**
 * Returns metrics for given sketch (can be an array of sketches)
 */
export const metricsForSketch = <M extends SimpleSketchMetric>(
  metrics: M[],
  sketch: Sketch | NullSketch | Sketch[] | NullSketch[]
) => metricsWithSketchId(metrics, sketchToId(sketch));

/**
 * Returns the first metric that returns true for metricFilter
 * @returns
 */
export const firstMatchingMetric = <M extends SimpleMetric>(
  metrics: M[],
  metricFilter: (metric: M) => boolean
) => {
  const metric = metrics.find((m) => metricFilter(m));
  if (!metric) throw new Error(`firstMatchingMetrics: metric not found`);
  return metric;
};

/**
 * Sort function to sort report data classes alphabetically by display name
 * @param a
 * @param b
 * @returns
 */
const classSortAlphaDisplay = (a: DataClass, b: DataClass) => {
  const aName = a.display;
  const bName = b.display;
  return aName.localeCompare(bName);
};

/**
 * Returns new sketch metrics with percentage of total value
 * If metrics and totals are additionally stratified by classId, then that will be used
 * Deep copies and maintains all other properties from the original metric
 */
export const sketchMetricPercent = (
  metrics: ExtendedSketchMetric[],
  totals: ExtendedMetric[]
): ExtendedSketchMetric[] => {
  const totalsByKey = (() => {
    return keyBy(totals, (total) =>
      total.classId ? total.classId : total.metricId
    );
  })();
  return metrics.map((curMetric) => {
    if (!curMetric || curMetric.value === undefined)
      throw new Error(`Malformed metrics: ${JSON.stringify(curMetric)}`);

    const idProperty = curMetric.classId ? "classId" : "metricId";

    const idValue = curMetric[idProperty];
    if (!idValue) throw new Error(`Missing total index: ${idValue}`);

    const value = curMetric[idProperty];
    if (!value)
      throw new Error(
        `Missing metric id property ${idProperty}, ${JSON.stringify(curMetric)}`
      );
    const totalMetric = totalsByKey[idValue];
    if (!totalMetric) {
      throw new Error(
        `Missing total: ${idProperty}: ${JSON.stringify(curMetric)}`
      );
    }
    return {
      ...deepCopy(curMetric),
      value: curMetric.value / totalMetric.value,
    };
  });
};

/**
 * Recursively groups metrics by ID in order of ids specified to create arbitrary nested hierarchy for fast lookup.
 */
export const nestMetrics = (
  metrics: any[],
  ids: string[]
): Record<string, any> => {
  const grouped = groupBy(metrics, (m) => m[ids[0]]);
  if (ids.length === 1) {
    return grouped;
  }
  return reduce(
    grouped,
    (result, groupMetrics, curId) => {
      return {
        ...result,
        [curId]: nestMetrics(groupMetrics, ids.slice(1)),
      };
    },
    {}
  );
};

/**
 * Flattens class sketch metrics into array of objects, one for each sketch, where each object contains all class metrics values
 * @param classMetrics - class metric data with sketch
 * @param classes
 * @returns
 */
export const flattenSketchAllClassNext = (
  metrics: ExtendedSketchMetric[],
  classes: DataClass[],
  sketches: Sketch[] | NullSketch[],
  /** function to sort class configs using Array.sort, defaults to alphabetical by display name */
  sortFn?: (a: DataClass, b: DataClass) => number
): Record<string, string | number>[] => {
  const metricsByClass = groupBy(
    metrics,
    (metric) => metric.classId || "error"
  );
  let sketchRows: Record<string, string | number>[] = [];
  sketches.forEach((curSketch) => {
    const classMetricAgg = classes
      .sort(sortFn || classSortAlphaDisplay)
      .reduce<Record<string, number>>((aggSoFar, curClass) => {
        const sketchMetricsById = metricsByClass[curClass.classId].reduce<
          Record<string, ExtendedSketchMetric>
        >((soFar, sm) => ({ ...soFar, [sm.sketchId || "undefined"]: sm }), {});
        return {
          ...aggSoFar,
          ...{
            [curClass.classId]:
              sketchMetricsById[curSketch.properties.id].value,
          },
        };
      }, {});
    sketchRows.push({
      sketchId: curSketch.properties.id,
      sketchName: curSketch.properties.name,
      ...classMetricAgg,
    });
  });
  return sketchRows;
};

/**
 * Returns aggregate sketch metric, containing all metric values using metricId property
 * @param metrics - class metric data with sketch
 * @param extraFlatProperty - optional id property to cross flatten with metric.  Properties will be keyed extraId_metricId
 */
export const flattenSketchMetric = (
  metrics: ExtendedSketchMetric[],
  flatProperty: MetricIdNames,
  options: {
    extraFlatProperty?: MetricIdNames;
    // groupProperty?: "classId" | "groupId" | "reportId" | "geographyId",
  } = {}
): Record<string, MetricIdTypes>[] => {
  const { extraFlatProperty } = options;
  const flatMetrics = groupBy(metrics, (m) => {
    if (m[flatProperty]) {
      return m[flatProperty] as MetricIdTypes;
    }
    throw new Error(
      `Metric is missing flatProperty ${flatProperty}: ${JSON.stringify(m)}`
    );
  });

  const metricsBySketchId = groupBy(metrics, (metric) => metric.sketchId);

  const sketchRows = Object.keys(metricsBySketchId).reduce<
    Record<string, MetricIdTypes>[]
  >((rowsSoFar, curSketchId) => {
    const metricAgg = Object.keys(flatMetrics).reduce<
      Record<string, string | number>
    >((aggSoFar, curMetricId) => {
      // GET ONE OR GET MULTIPLE BY GROUP
      const curMetric = metricsBySketchId[curSketchId].find(
        (m) => m.metricId === curMetricId
      );

      if (curMetric === undefined) return aggSoFar;
      const prop = extraFlatProperty
        ? `${curMetric[extraFlatProperty]}_${curMetric?.metricId}`
        : curMetric?.metricId;

      // RETURN ONE OR RETURN MULTIPLE BY SAY CLASS
      return {
        ...aggSoFar,
        ...{
          [prop]: curMetric?.value || 0,
        },
      };
    }, {});

    return [
      ...rowsSoFar,
      {
        sketchId: curSketchId,
        ...metricAgg,
      },
    ];
  }, []);
  return sketchRows;
};

/**
 * Flattens group class metrics, one object for each group.
 * Each object includes a percValue for each
 * class, count of child sketches in the group, and sum of value and percValue
 * across classes.
 */
export const flattenByGroup = (
  collection: SketchCollection | NullSketchCollection,
  /** Group metrics for collection and its child sketches */
  groupMetrics: ExtendedSketchMetric[],
  /** Totals by class */
  totals: ExtendedMetric[]
): {
  value: number;
  groupId: string;
  percValue: number;
}[] => {
  // Stratify in order by Group -> Collection -> Class. Then flatten
  const metricsByGroup = groupBy(groupMetrics, (m) => m.groupId || "undefined");

  return Object.keys(metricsByGroup).map((curGroupId) => {
    const collGroupMetrics = metricsByGroup[curGroupId].filter(
      (m) => m.sketchId === collection.properties.id && m.groupId === curGroupId
    );
    const collGroupMetricsByClass = keyBy(
      collGroupMetrics,
      (m) => m.classId || "undefined"
    );

    const classAgg = Object.keys(collGroupMetricsByClass).reduce(
      (rowsSoFar, curClassId) => {
        const groupClassSketchMetrics = groupMetrics.filter(
          (m) =>
            m.sketchId !== collection.properties.id &&
            m.groupId === curGroupId &&
            m.classId === curClassId
        );

        const curValue = collGroupMetricsByClass[curClassId]?.value;
        // Skip if no metric for this class
        // if (!curValue) {
        //   return rowsSoFar;
        // }

        const classTotal = firstMatchingMetric(
          totals,
          (totalMetric) => totalMetric.classId === curClassId
        ).value;

        return {
          ...rowsSoFar,
          [curClassId]: curValue / classTotal,
          numSketches: groupClassSketchMetrics.length,
          value: rowsSoFar.value + curValue,
        };
      },
      { value: 0 }
    );

    const groupTotal = firstMatchingMetric(totals, (m) => !m.classId).value;
    return {
      groupId: curGroupId,
      percValue: classAgg.value / groupTotal,
      ...classAgg,
    };
  });
};

/**
 * Flattens group class metrics, one for each group and sketch.
 * Each object includes the percValue for each class, and the total percValue with classes combined
 * groupId, sketchId, class1, class2, ..., total
 * @param groupMetrics - group metric data
 * @param totalValue - total value with classes combined
 * @param classes - class config
 * @returns
 */
export const flattenByGroupSketch = (
  collection: SketchCollection | NullSketchCollection,
  /** Group metrics for collection and its child sketches */
  groupMetrics: ExtendedSketchMetric[],
  /** Totals by class */
  totals: ExtendedMetric[]
): GroupMetricSketchAgg[] => {
  const sketchIds = collection.features.map((sk) => sk.properties.id);
  let sketchRows: GroupMetricSketchAgg[] = [];

  // Stratify in order by Group -> Sketch -> Class. Then flatten

  const metricsByGroup = groupBy(groupMetrics, (m) => m.groupId || "undefined");

  Object.keys(metricsByGroup).forEach((curGroupId) => {
    const groupSketchMetrics = metricsByGroup[curGroupId].filter((m) =>
      sketchIds.includes(m.sketchId)
    );
    const groupSketchMetricsByClass = groupBy(
      groupSketchMetrics,
      (m) => m.classId || "undefined"
    );
    const groupSketchMetricIds = Object.keys(
      groupBy(groupSketchMetrics, (m) => m.sketchId)
    );

    groupSketchMetricIds.forEach((curSketchId) => {
      const classAgg = Object.keys(groupSketchMetricsByClass).reduce<
        Record<string, number>
      >(
        (classAggSoFar, curClassId) => {
          const classMetric = firstMatchingMetric(
            groupSketchMetricsByClass[curClassId],
            (m) => m.sketchId === curSketchId
          );
          const classTotal = firstMatchingMetric(
            totals,
            (totalMetric) => totalMetric.classId === curClassId
          ).value;

          return {
            ...classAggSoFar,
            value: classAggSoFar.value + classMetric.value,
            [curClassId]: classMetric.value / classTotal,
          };
        },
        { value: 0 }
      );

      const groupTotal = firstMatchingMetric(totals, (m) => !m.classId).value;
      sketchRows.push({
        groupId: curGroupId,
        sketchId: curSketchId,
        value: classAgg.value,
        percValue: classAgg.value / groupTotal,
        ...classAgg,
      });
    });
  });
  return sketchRows;
};

//// DEPRECATED?

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
  classes: DataClass[]
): GroupMetricSketchAgg[] => {
  let sketchRows: GroupMetricSketchAgg[] = [];

  Object.keys(groupMetrics).forEach((groupId) => {
    const classMetrics = groupMetrics[groupId];
    // Inspect first class to get list of sketches in this group
    const sketchesInGroup = Object.values(
      classMetrics
    )[0].sketchMetrics.map((sm) => ({ id: sm.id, name: sm.name }));

    sketchesInGroup.forEach((sketchInGroup) => {
      // Build up agg percValue for each class
      const classAgg = classes.reduce<Record<string, number>>(
        (classAggSoFar, curClass) => {
          const curClassName = curClass.classId;
          const groupSketchMetrics = classMetrics[
            curClassName
          ].sketchMetrics.reduce<Record<string, SketchMetric>>(
            (soFar, sm) => ({ ...soFar, [sm.id]: sm }),
            {}
          );
          return {
            ...classAggSoFar,
            value:
              classAggSoFar.value + groupSketchMetrics[sketchInGroup.id].value,
            [curClassName]: groupSketchMetrics[sketchInGroup.id].percValue,
          };
        },
        { value: 0 }
      );

      sketchRows.push({
        groupId,
        sketchId: sketchInGroup.id,
        sketchName: sketchInGroup.name,
        value: classAgg.value,
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
  classes: DataClass[]
) => {
  // Inspect first class to get list of sketches
  const sketches = Object.values(classMetrics)[0].sketchMetrics.map((sm) => ({
    id: sm.id,
    name: sm.name,
  }));

  let sketchRows: ClassMetricSketchAgg[] = [];
  sketches.forEach((curSketch) => {
    classes.forEach((curClass) => {
      const curClassName = curClass.classId;
      const sketchMetricsById = classMetrics[curClassName].sketchMetrics.reduce<
        Record<string, SketchMetric>
      >((soFar, sm) => ({ ...soFar, [sm.id]: sm }), {});
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
  classes: DataClass[],
  /** function to sort class configs using Array.sort, defaults to alphabetical by display name */
  sortFn?: (a: DataClass, b: DataClass) => number
) => {
  // Inspect first class to get list of sketches
  const sketches = Object.values(classMetrics)[0].sketchMetrics.map((sm) => ({
    id: sm.id,
    name: sm.name,
  }));

  let sketchRows: Record<string, string | number>[] = [];
  sketches.forEach((curSketch) => {
    const classMetricAgg = classes
      .sort(sortFn || classSortAlphaDisplay)
      .reduce<Record<string, number>>((aggSoFar, curClass) => {
        const curClassName = curClass.classId;
        const sketchMetricsById = classMetrics[
          curClassName
        ].sketchMetrics.reduce<Record<string, SketchMetric>>(
          (soFar, sm) => ({ ...soFar, [sm.id]: sm }),
          {}
        );
        return {
          ...aggSoFar,
          ...{
            [curClassName]: sketchMetricsById[curSketch.id].percValue,
          },
        };
      }, {});
    sketchRows.push({
      sketchId: curSketch.id,
      sketchName: curSketch.name,
      ...classMetricAgg,
    });
  });
  return sketchRows;
};
