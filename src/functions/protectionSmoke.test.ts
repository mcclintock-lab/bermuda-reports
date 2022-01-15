/**
 * @group smoke
 */
import { protection } from "./protection";
import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof protection).toBe("function");
  });
  test("protectionSmoke - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await protection(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "protection", example.properties.name);
    }
  });
});

// Unit test needs
// test overlap with two different levels, check final area and percent
