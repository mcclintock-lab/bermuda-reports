/**
 * @group unit
 */

import {
  ValidationError,
  Feature,
  Polygon,
  MultiPolygon,
  Sketch,
} from "@seasketch/geoprocessing";
import { iucnCategoryForSketch } from "./iucnProtectionLevel";

const genSketchWithActivities = (activities: string[]): Sketch => {
  return {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [],
    },
    properties: {
      id: "615bbbe9aac8c8285d50db2d",
      name: "mpa-test",
      updatedAt: "2021-10-05T02:43:53.326Z",
      createdAt: "2021-10-05T02:43:53.326Z",
      sketchClassId: "615b59e1aac8c8285d50d9b8",
      isCollection: false,
      userAttributes: [
        {
          label: "Allowed Activities",
          fieldType: "ChoiceField",
          exportId: "ACTIVITIES",
          value: activities,
        },
      ],
    },
  };
};

describe("IUCN protection level", () => {
  test("no activity returns null category", async () => {
    const category = iucnCategoryForSketch(genSketchWithActivities([]));
    expect(category).toBe(null);
  });

  test("single activity - 1a", async () => {
    const category = iucnCategoryForSketch(
      genSketchWithActivities(["RESEARCH_NE"])
    );
    expect(category).toBe("1a");
  });

  test("single activity - 1b", async () => {
    const category = iucnCategoryForSketch(
      genSketchWithActivities(["TRAD_FISH_COLLECT"])
    );
    expect(category).toBe("1b");
  });

  test("single activity - 2/3", async () => {
    const category = iucnCategoryForSketch(
      genSketchWithActivities(["TOURISM"])
    );
    expect(category).toBe("2/3");
  });

  // Category 3 is unreachable because 2 will always match

  test("single activity - 4/6", async () => {
    const category = iucnCategoryForSketch(
      genSketchWithActivities(["SHIPPING"])
    );
    expect(category).toBe("4/6");
  });

  test("single activity - 5", async () => {
    const category = iucnCategoryForSketch(
      genSketchWithActivities(["HABITATION"])
    );
    expect(category).toBe("5");
  });

  // Category 6 is unreachable because 4 will always match

  test("single - industrial should not match any", async () => {
    const category = iucnCategoryForSketch(
      genSketchWithActivities(["FISH_AQUA_INDUSTRIAL"])
    );
    expect(category).toBe(null);
  });

  test("single - works should not match any", async () => {
    const category = iucnCategoryForSketch(
      genSketchWithActivities(["UNTREATED_WATER"])
    );
    expect(category).toBe(null);
  });

  test("single - mining should not match any", async () => {
    const category = iucnCategoryForSketch(
      genSketchWithActivities(["MINING_OIL_GAS"])
    );
    expect(category).toBe(null);
  });

  test("multiple - research + mining should not match any", async () => {
    const category = iucnCategoryForSketch(
      genSketchWithActivities(["RESEARCH_NE", "MINING_OIL_GAS"])
    );
    expect(category).toBe(null);
  });
});
