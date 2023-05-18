/**
 * @jest-environment node
 * @group smoke
 */
import handler from "./habitatProtectionOffshore";
import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof handler.func).toBe("function");
  });
  test("habitatProtectionOffshoreSmoke - tests run against all examples", async () => {
    // data fetch fails if run all sketches, too many requests?
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await handler.func(example);
      expect(result).toBeTruthy();
      writeResultOutput(
        result,
        "habitatProtectionOffshore",
        example.properties.name
      );
    }
  }, 60000);
});
