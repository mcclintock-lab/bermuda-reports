/**
 * @jest-environment node
 * @group smoke
 */
import { oceanUse } from "./oceanUse";
import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof oceanUse).toBe("function");
  });
  test("oceanUseSmoke - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await oceanUse(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "oceanUse", example.properties.name);
    }
  }, 60000);
});
