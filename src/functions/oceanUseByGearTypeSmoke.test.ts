/**
 * @jest-environment node
 * @group smoke
 */
import { oceanUseByGearType } from "./oceanUseByGearType";
import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof oceanUseByGearType).toBe("function");
  });
  test("oceanUseByGearTypeSmoke - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await oceanUseByGearType(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "oceanUseByGearType", example.properties.name);
    }
  }, 60000);
});
