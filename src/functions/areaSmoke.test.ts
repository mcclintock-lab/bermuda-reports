/**
 * @group smoke
 */
import { area } from "./area";
import { STUDY_REGION_AREA_SQ_METERS } from "../_config";
import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof area).toBe("function");
  });
  test("tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await area(example);
      expect(result.area).toBeGreaterThan(0);
      expect(result.area).toBeLessThanOrEqual(STUDY_REGION_AREA_SQ_METERS);
      writeResultOutput(result, "area", example.properties.name);
    }
  });
});
