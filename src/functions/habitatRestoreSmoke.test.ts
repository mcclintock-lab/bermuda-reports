/**
 * @group smoke
 */
import { habitatRestore } from "./habitatRestore";
import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof habitatRestore).toBe("function");
  });
  test("tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await habitatRestore(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "habitatRestore", example.properties.name);
    }
  }, 60000);
});
