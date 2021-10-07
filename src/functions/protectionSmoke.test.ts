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
      console.log("sketchCategories", result);
      result.sketchCategories.forEach((sCat) => {
        expect(
          typeof sCat.category === "string" || sCat.category === null
        ).toBe(true);
        expect(
          typeof sCat.sketchId === "string" || sCat.sketchId === null
        ).toBe(true);
      });
      writeResultOutput(result, "protection", example.properties.name);
    }
  });
});
