/**
 * @group unit
 */

import { areaStats, subAreaStats } from "./areaStats";
import {
  genSampleSketch,
  genSampleSketchCollection,
} from "@seasketch/geoprocessing";
import {
  featureCollection,
  feature,
  Feature,
  Polygon,
  polygon,
} from "@turf/helpers";
import area from "@turf/area";

const outer: Feature<Polygon> = feature({
  type: "Polygon",
  coordinates: [
    [
      [0, 0],
      [2, 0],
      [2, 2],
      [0, 2],
      [0, 0],
    ],
  ],
});
const outerArea = area(outer);

const outerOuter: Feature<Polygon> = feature({
  type: "Polygon",
  coordinates: [
    [
      [0, 0],
      [4, 0],
      [4, 4],
      [0, 4],
      [0, 0],
    ],
  ],
});
const outerOuterArea = area(outerOuter);

// full inside outer
const poly1 = polygon([
  [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
    [0, 0],
  ],
]);
const sketch1 = genSampleSketch(poly1.geometry);

// half inside outer
const poly2 = polygon([
  [
    [1, 1],
    [2, 1],
    [2, 3],
    [1, 3],
    [1, 1],
  ],
]);
const sketch2 = genSampleSketch(poly2.geometry);

// fully outside outer
const poly3 = polygon([
  [
    [3, 3],
    [4, 3],
    [4, 4],
    [3, 4],
    [3, 3],
  ],
]);
const sketch3 = genSampleSketch(poly3.geometry);

const sc = genSampleSketchCollection(featureCollection([poly1, poly2, poly3]));
const scArea = area(sc);

describe("Area stats tool", () => {
  test("function is present", () => {
    expect(typeof areaStats).toBe("function");
  });

  test("outerArea", () => {
    expect(outerArea).toBeCloseTo(49558050527.3877);
  });
  test("outerOuterArea", () => {
    expect(outerOuterArea).toBeCloseTo(198111444408.08057);
  });

  // sketch always assumed to be within outer boundary.  outerArea is passed as pre-calculated area avoiding need to compute it on the fly
  test("overall - single polygon fully inside", async () => {
    const stats = await areaStats("test", sketch1, outerArea);
    expect(stats.value).toBeCloseTo(12391399902.071104);
    expect(stats.percValue).toBeCloseTo(0.25); // takes up bottom left quadrant of outer
  });

  test("subarea intersect - single polygon fully inside", async () => {
    const stats = await subAreaStats("test", sketch1, outer);
    expect(stats.value).toBeCloseTo(12391399902.071104);
    expect(stats.percValue).toBeCloseTo(0.25);
  });

  test("subarea difference - single polygon fully inside", async () => {
    const stats = await subAreaStats("test", sketch1, outer, {
      operation: "difference",
      outerArea,
    });
    expect(stats.value).toBeCloseTo(0);
    expect(stats.percValue).toBeCloseTo(0);
  });

  test("subarea intersect - single polygon fully outside", async () => {
    const stats = await subAreaStats("test", sketch3, outer);
    expect(stats.value).toBeCloseTo(0);
    expect(stats.percValue).toBeCloseTo(0);
  });

  test("subarea difference - single polygon fully outside outer, inside of outerOuter", async () => {
    const stats = await subAreaStats("test", sketch3, outer, {
      operation: "difference",
      outerArea: outerOuterArea,
    });
    expect(stats.value).toBeCloseTo(12368758407.838667);
    expect(stats.percValue).toBeCloseTo(0.08326); // should be 1 square of 16 in outerOuter
  });

  // sketch always assumed to be within outer boundary.  outerArea is passed as pre-calculated area avoiding need to compute it on the fly
  test("overall - network", async () => {
    const stats = await areaStats("test", sc, outerOuterArea);
    expect(stats.value).toBeCloseTo(49527861102.020134);
    expect(stats.percValue).toBeCloseTo(0.25); // takes up 4 out of 16 squares of outerOuter
    expect(stats.sketchMetrics.length).toBe(sc.features.length);
  });

  test("subarea intersect - network, half inside and outside", async () => {
    const stats = await subAreaStats("test", sc, outer);
    expect(scArea).toBe(49527861102.020134);
    expect(stats.value).toBeCloseTo(24779025263.69385); // Expect about half, but not exactly same as inside
    expect(stats.percValue).toBeCloseTo(2 / 4); // 2 of 4 squares in outer
    expect(stats.sketchMetrics.length).toBe(sc.features.length);
  });

  test("subarea difference - network, half inside and outside", async () => {
    const stats = await subAreaStats("test", sc, outer, {
      operation: "difference",
      outerArea: outerOuterArea,
    });
    expect(scArea).toBe(49527861102.020134);
    expect(stats.value).toBeCloseTo(24748835838.326283); // Expect about half, but not exactly same as inside
    expect(stats.percValue).toBeCloseTo(2 / 12.0); // 2 of 12 squares in outerOuter
    expect(stats.sketchMetrics.length).toBe(sc.features.length);
  });

  //ToDo: test for undefined feat, feat properties, and null geometry
});
