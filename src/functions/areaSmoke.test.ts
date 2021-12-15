/**
 * @group smoke
 */
import { area } from "./area";
import {
  STUDY_REGION_AREA_SQ_METERS,
  NEARSHORE_AREA_SQ_METERS,
  OFFSHORE_AREA_SQ_METERS,
} from "../_config";
import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof area).toBe("function");
  });
  test("areaSmoke - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await area(example);
      expect(result.eez.value).toBeGreaterThan(0);
      expect(result.eez.value).toBeLessThanOrEqual(STUDY_REGION_AREA_SQ_METERS);
      expect(result.nearshore.value).toBeLessThanOrEqual(
        NEARSHORE_AREA_SQ_METERS
      );
      expect(result.offshore.value).toBeLessThanOrEqual(
        OFFSHORE_AREA_SQ_METERS
      );
      writeResultOutput(result, "area", example.properties.name);
    }
  });
});
