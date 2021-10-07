import {
  Sketch,
  SketchCollection,
  Polygon,
  GeoprocessingHandler,
  toSketchArray,
  getUserAttribute,
} from "@seasketch/geoprocessing";
import { getCategoryForActivities } from "../util/iucnProtectionLevel";

export interface SketchCategory {
  sketchId: string;
  category: string | null;
}

export interface ProtectionResults {
  sketchCategories: SketchCategory[];
}

export async function protection(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<ProtectionResults> {
  const sketches = toSketchArray(sketch);
  const sketchCategories = sketches.map((s) => {
    // Get sketch allowed activities
    const activities: string[] = getJsonUserAttribute(s, "ACTIVITIES", []);
    return {
      sketchId: s.properties.id,
      category: getCategoryForActivities(activities),
    };
  });

  return {
    sketchCategories,
  };
}

export default new GeoprocessingHandler(protection, {
  title: "area",
  description: "Calculates IUCN protection levels",
  timeout: 5, // seconds
  executionMode: "sync",
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
});

function getJsonUserAttribute<T>(
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
