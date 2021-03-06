/**
 * @group smoke
 */

import { clipToOceanEez } from "./clipToOceanEez";
import {
  getExamplePolygonSketches,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { ValidationError } from "@seasketch/geoprocessing";
import booleanValid from "@turf/boolean-valid";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof clipToOceanEez).toBe("function");
  });

  test("clipToOceanEezSmoke", async () => {
    const examples = await getExamplePolygonSketches();
    for (const example of examples) {
      try {
        const result = await clipToOceanEez(example);
        expect(result).toBeTruthy();
        expect(booleanValid(result));
        expect(
          result.geometry.type === "Polygon" ||
            result.geometry.type === "MultiPolygon"
        );
        writeResultOutput(result, "clipToOceanEez", example?.properties?.name);
      } catch (e) {
        console.log("error", example?.properties?.name, e);
        if (e instanceof ValidationError) {
          // ValidationErrors don't indicate failures, just comprehensive tests
        } else {
          throw e;
        }
      }
    }
  });
});
