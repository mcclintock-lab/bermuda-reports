/**
 * @jest-environment node
 * @group smoke
 */
import Handler from "./platformEdge";
import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof Handler.func).toBe("function");
  });
  test("tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll("Example network");
    for (const example of examples) {
      const result = await Handler.func(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "platformEdge", example.properties.name);
    }
  });
});
