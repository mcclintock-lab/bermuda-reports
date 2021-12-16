import {
  Sketch,
  SketchCollection,
  Feature,
  MultiPolygon,
  Polygon,
  isSketchCollection,
  difference,
  intersect,
  toSketchArray,
} from "@seasketch/geoprocessing";
import { featureCollection } from "@turf/helpers";
import { featureEach } from "@turf/meta";
import turfArea from "@turf/area";
import { clip } from "../util/clip";
import { ClassMetricSketch } from "./types";

/**
 * Assuming sketches are within some outer boundary with size outerArea,
 * calculates the area of each sketch and the proportion of outerArea they take up.
 */
export async function overlapArea(
  /** Name of class */
  name: string,
  /** single sketch or collection. */
  sketch: Sketch<Polygon> | SketchCollection<Polygon>,
  /** area of outer boundary (typically EEZ or planning area) */
  outerArea: number
): Promise<ClassMetricSketch> {
  // Union to remove overlap
  const combinedSketch = isSketchCollection(sketch)
    ? clip(sketch.features, "union")
    : featureCollection([sketch]);

  if (!combinedSketch) throw new Error("areaStats - invalid sketch");

  const combinedSketchArea = turfArea(combinedSketch);
  let sketchMetrics: ClassMetricSketch["sketchMetrics"] = [];
  if (sketch) {
    featureEach(sketch, (feat) => {
      if (!feat || !feat.properties) {
        console.log(
          "Warning: feature or its properties are undefined, skipped"
        );
      } else if (!feat.geometry) {
        console.log(
          `Warning: feature is missing geometry, skipped: sketchId:${feat.properties.id}, name:${feat.properties.name}`
        );
        sketchMetrics.push({
          id: feat.properties.id,
          name: feat.properties.name,
          value: 0,
          percValue: 0 / outerArea,
        });
      } else {
        const sketchArea = turfArea(feat);
        sketchMetrics.push({
          id: feat.properties.id,
          name: feat.properties.name,
          value: sketchArea,
          percValue: sketchArea / outerArea,
        });
      }
    });
  }

  return {
    name,
    value: combinedSketchArea,
    percValue: combinedSketchArea / outerArea,
    sketchMetrics,
  };
}

/**
 * Returns area stats for sketch input after performing overlay operation against a subarea feature.
 * For sketch collections, dissolve is used when calculating total sketch area to prevent double counting
 */
export async function overlapSubarea(
  /** Name of class */
  name: string,
  sketch: Sketch<Polygon> | SketchCollection<Polygon>,
  /** subarea feature */
  subareaFeature: Feature<Polygon | MultiPolygon> | Polygon | MultiPolygon,
  options?: {
    /** operation to perform on sketch in relation to sub area features, defaults to 'intersection' */
    operation?: "intersect" | "difference";
    /** area of outer boundary.  Use for total area of the subarea for intersection when you don't have the whole feature, or use for the total area of the boundar outside of the subarea for difference (typically EEZ or planning area) */
    outerArea?: number | undefined;
  }
): Promise<ClassMetricSketch> {
  const operation = options?.operation || "intersect";
  const subareaArea =
    options?.outerArea && operation === "intersect"
      ? options?.outerArea
      : turfArea(subareaFeature);
  const sketches = toSketchArray(sketch);

  if (operation === "difference" && !options?.outerArea)
    throw new Error(
      "Missing outerArea which is required when operation is difference"
    );

  // Run op and keep null remainders for reporting purposes
  const subsketches = (() => {
    if (operation === "intersect") {
      return sketches.map((sketch) => intersect(subareaFeature, sketch));
    } else {
      return sketches.map((sketch) => difference(sketch, subareaFeature));
    }
  })();

  // calculate area of all subsketches
  const subsketchArea = (() => {
    // Remove null
    const allSubsketches = subsketches.reduce<
      Feature<Polygon | MultiPolygon>[]
    >(
      (subsketches, subsketch) =>
        subsketch ? [...subsketches, subsketch] : subsketches,
      []
    );
    // Remove overlap
    const combinedSketch =
      allSubsketches.length > 0
        ? clip(allSubsketches, "union")
        : featureCollection(allSubsketches);

    return allSubsketches && combinedSketch ? turfArea(combinedSketch) : 0;
  })();

  // Choose inner or outer subarea for calculating percentage
  const operationArea = (() => {
    if (operation === "difference" && options?.outerArea) {
      return options?.outerArea - subareaArea;
    } else {
      return subareaArea;
    }
  })();

  let sketchMetrics: ClassMetricSketch["sketchMetrics"] = [];
  if (subsketches)
    subsketches.forEach((feat, index) => {
      if (feat) {
        const subsketchArea = turfArea(feat);
        sketchMetrics.push({
          id: sketches[index].properties.id,
          name: sketches[index].properties.name,
          value: subsketchArea,
          percValue: subsketchArea === 0 ? 0 : subsketchArea / operationArea,
        });
      } else {
        sketchMetrics.push({
          id: sketches[index].properties.id,
          name: sketches[index].properties.name,
          value: 0,
          percValue: 0,
        });
      }
    });

  return {
    name,
    value: subsketchArea,
    percValue: subsketchArea === 0 ? 0 : subsketchArea / operationArea,
    sketchMetrics,
  };
}
