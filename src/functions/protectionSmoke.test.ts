/**
 * @group smoke
 */
import { protection } from "./protection";
import { iucnCategories } from "../util/iucnProtectionLevel";
import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof protection).toBe("function");
  });
  test("tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await protection(example);
      expect(result).toBeTruthy();
      result.sketchStats.forEach((sStat) => {
        expect(
          typeof sStat.category === "string" || sStat.category === null
        ).toBe(true);
        expect(
          typeof sStat.sketchId === "string" || sStat.sketchId === null
        ).toBe(true);
        expect(sStat.percPlanningArea).toBeGreaterThanOrEqual(0);
      });
      writeResultOutput(result, "protection", example.properties.name);
    }
  });
});
