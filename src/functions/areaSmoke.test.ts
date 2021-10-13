/**
 * @group smoke
 */
import { area, NEARSHORE_AREA, OFFSHORE_AREA } from "./area";
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
      expect(result.eez.area).toBeGreaterThan(0);
      expect(result.eez.area).toBeLessThanOrEqual(STUDY_REGION_AREA_SQ_METERS);
      expect(result.nearshore.area).toBeLessThanOrEqual(NEARSHORE_AREA);
      expect(result.offshore.area).toBeLessThanOrEqual(OFFSHORE_AREA);
      writeResultOutput(result, "area", example.properties.name);
    }
  });
});
