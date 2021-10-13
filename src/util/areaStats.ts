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
  FeatureCollection,
} from "@seasketch/geoprocessing";
import { featureCollection } from "@turf/helpers";
import { featureEach } from "@turf/meta";
import turfArea from "@turf/area";
import dissolve from "@turf/dissolve";
import flatten from "@turf/flatten";

export interface AreaMetric {
  /** Total area of sketch input in square meters (after any supported operation and dissolving their overlap) */
  area: number;
  /** Proportion of sketch area to outer area */
  percArea: number;
  /** Area stats calculated per sketch polygon */
  sketchAreas: {
    sketchId: string;
    name: string;
    area: number;
    percArea: number;
  }[];
  /** Unit of measurement for area values */
  areaUnit: string;
}

/**
 * Returns area stats for sketch input in relation to outer boundary`.
 * For sketch collections, dissolve is used when calculating total sketch area to prevent double counting
 */
export async function areaStats(
  /** single sketch or collection. */
  sketch: Sketch<Polygon> | SketchCollection<Polygon>,
  /** area of outer boundary (typically EEZ or planning area) */
  outerArea: number,
  options: {
    /** system of measurement */
    units: "imperial" | "metric";
    /** Whether to calculate individual sketch areas, otherwide just overall */
    includeSketchAreas: boolean;
  } = { units: "metric", includeSketchAreas: true }
): Promise<AreaMetric> {
  const sketches = toSketchArray(sketch);
  const combinedSketch = isSketchCollection(sketch)
    ? dissolve(sketch)
    : featureCollection([sketch]);

  const combinedSketchArea = turfArea(combinedSketch);
  let sketchAreas: AreaMetric["sketchAreas"] = [];
  if (options?.includeSketchAreas) {
    featureEach(sketch, (feat) => {
      const sketchArea = turfArea(feat);
      sketchAreas.push({
        sketchId: feat.properties.id,
        name: feat.properties.name,
        area: sketchArea,
        percArea: sketchArea / outerArea,
      });
    });
  }

  return {
    area: combinedSketchArea,
    percArea: combinedSketchArea / outerArea,
    sketchAreas,
    areaUnit: "square meters",
  };
}

/**
 * Returns area stats for sketch input after performing overlay operation against a subarea feature`.
 * For sketch collections, dissolve is used when calculating total sketch area to prevent double counting
 */
export async function subAreaStats(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>,
  /** subarea feature */
  subareaFeature: Feature<Polygon | MultiPolygon> | Polygon | MultiPolygon,
  options: {
    /** system of measurement */
    units?: "imperial" | "metric";
    /** Whether to calculate individual sketch areas, otherwide just overall */
    includeSketchAreas?: boolean;
    /** operation to perform on sketch in relation to sub area features, defaults to 'intersection' */
    operation?: "intersect" | "difference";
    /** area of outer boundary (typically EEZ or planning area).  used to calculate the area outside of the subarea for difference */
    outerArea?: number;
  } = {
    units: "metric",
    includeSketchAreas: true,
    operation: "intersect",
  }
): Promise<AreaMetric> {
  const subareaArea = turfArea(subareaFeature);
  const sketches = toSketchArray(sketch);

  if (options.operation === "difference" && !options.outerArea)
    throw new Error(
      "Missing outerArea which is required when operation is difference"
    );

  // Run op and keep null remainders for reporting purposes
  const subsketches = (() => {
    if (options?.operation === "intersect") {
      return sketches.map((sketch) => intersect(subareaFeature, sketch));
    } else {
      return sketches.map((sketch) => difference(sketch, subareaFeature));
    }
  })();

  // calculate area of all subsketches, removing null and overlap
  const subsketchArea = (() => {
    const allSubsketches = subsketches.reduce<
      Feature<Polygon | MultiPolygon>[]
    >(
      (subsketches, sketch) =>
        sketch ? [...subsketches, sketch] : subsketches,
      []
    );
    return allSubsketches
      ? turfArea(dissolve(flatten(featureCollection(allSubsketches))))
      : 0;
  })();

  // Choose inner or outer subarea for calculating percentage
  const operationArea = (() => {
    if (options.operation === "difference" && options.outerArea) {
      return options.outerArea - subareaArea;
    } else {
      return subareaArea;
    }
  })();

  let subSketchAreas: AreaMetric["sketchAreas"] = [];
  if (subsketches)
    subsketches.forEach((feat, index) => {
      if (feat) {
        const subsketchArea = turfArea(feat);
        subSketchAreas.push({
          sketchId: sketches[index].properties.id,
          name: sketches[index].properties.name,
          area: subsketchArea,
          percArea: subsketchArea === 0 ? 0 : subsketchArea / operationArea,
        });
      } else {
        subSketchAreas.push({
          sketchId: sketches[index].properties.id,
          name: sketches[index].properties.name,
          area: 0,
          percArea: 0,
        });
      }
    });

  return {
    area: subsketchArea,
    percArea: subsketchArea === 0 ? 0 : subsketchArea / operationArea,
    sketchAreas: subSketchAreas,
    areaUnit: "square meters",
  };
}
