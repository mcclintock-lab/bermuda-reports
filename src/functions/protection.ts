import {
  Sketch,
  SketchCollection,
  Polygon,
  GeoprocessingHandler,
  toSketchArray,
} from "@seasketch/geoprocessing";
import { iucnCategoryForSketch } from "../util/iucnProtectionLevel";

export interface ProtectionResults {
  sketchCategories: Array<{ sketchId: string; category: string | null }>;
}

export async function protection(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<ProtectionResults> {
  const sketches = toSketchArray(sketch);
  const sketchCategories = sketches.map((s) => ({
    sketchId: s.properties.id,
    category: iucnCategoryForSketch(s),
  }));

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
