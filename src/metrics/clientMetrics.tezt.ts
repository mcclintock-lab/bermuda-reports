/**
 * @group unit
 */

import { flattenSketchAllClassNext } from "./clientMetrics";
import { ExtendedSketchMetric } from "./types";
import { NullSketch } from "@seasketch/geoprocessing/client";

const CLASSES = [
  {
    classId: "Class1",
    display: "Class1",
  },
  {
    classId: "Class2",
    display: "Class2",
  },
];

const metrics: ExtendedSketchMetric[] = [
  {
    metricId: "metric1",
    sketchId: "a",
    value: 1555720.8217766285,
    classId: "Class1",
  },
  {
    metricId: "metric1",
    sketchId: "b",
    value: 1254996.874171406,
    classId: "Class1",
  },
  {
    metricId: "metric1",
    sketchId: "619834743ff3e57f7333d93e",
    value: 1555720.8217766285,
    classId: "Class1",
  },
  {
    metricId: "metric1",
    sketchId: "a",
    value: 991147.264895618,
    classId: "Class2",
  },
  {
    metricId: "metric1",
    sketchId: "b",
    value: 833147.2661019266,
    classId: "Class2",
  },
  {
    metricId: "metric1",
    sketchId: "619834743ff3e57f7333d93e",
    value: 991147.264895618,
    classId: "Class2",
  },
];

const sketches: NullSketch[] = [
  {
    type: "Feature",
    properties: {
      id: "a",
      name: "SketchA",
      updatedAt: "2021-11-20T00:00:34.365Z",
      createdAt: "2021-10-28T13:49:22.785Z",
      sketchClassId: "615b59e1aac8c8285d50d9b8",
      isCollection: false,
      userAttributes: [],
    },
    id: "1",
    bbox: [
      -65.82155643515347,
      31.12299873603807,
      -62.698478088902476,
      33.86373197667135,
    ],
    geometry: null,
  },
  {
    type: "Feature",
    properties: {
      id: "b",
      name: "SketchB",
      updatedAt: "2021-11-19T23:59:16.315Z",
      createdAt: "2021-11-19T23:34:00.777Z",
      sketchClassId: "615b59e1aac8c8285d50d9b8",
      isCollection: false,
      userAttributes: [],
    },
    id: "2",
    bbox: [
      -65.92172084860616,
      31.426079167891885,
      -63.197111473606924,
      34.14549731338192,
    ],
    geometry: null,
  },
];

const result = [
  {
    Class1: 0.8,
    Class2: 0.9,
    sketchId: "a",
    sketchName: "SketchA",
  },
  {
    Class1: 0.2,
    Class2: 0.3,
    sketchId: "b",
    sketchName: "SketchB",
  },
];

describe("flattenSketchAllClass", () => {
  test("flattenSketchAllClass - basic", async () => {
    const rows = flattenSketchAllClassNext(metrics, CLASSES, sketches);
    expect(result[0].Class1).toBeGreaterThan(0);
    expect(result[0].Class2).toBeGreaterThan(0);
    expect(result[1].Class1).toBeGreaterThan(0);
    expect(result[1].Class2).toBeGreaterThan(0);
  });
});
