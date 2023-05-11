/**
 * @jest-environment node
 * @group smoke
 */
import { oceanUseBySector } from "./oceanUseBySector";
import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof oceanUseBySector).toBe("function");
  });
  test("oceanUseBySectorSmoke - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await oceanUseBySector(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "oceanUseBySector", example.properties.name);
    }
  }, 60000);
});
