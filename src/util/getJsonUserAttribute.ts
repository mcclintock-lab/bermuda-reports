import { Sketch, getUserAttribute } from "@seasketch/geoprocessing";

export function getJsonUserAttribute<T>(
  sketch: Sketch,
  exportid: string,
  defaultValue: T
): T {
  const value = getUserAttribute(sketch, exportid, defaultValue);
  if (typeof value === "string") {
    return JSON.parse(value);
  } else {
    return value;
  }
}
