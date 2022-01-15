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
import { SimpleSketchMetric } from "./types";

/**
 * Assuming sketches are within some outer boundary with size outerArea,
 * calculates the area of each sketch and the proportion of outerArea they take up.
 */
export async function overlapArea(
  /** Metric identifier */
  metricId: string,
  /** single sketch or collection. */
  sketch: Sketch<Polygon> | SketchCollection<Polygon>,
  /** area of outer boundary (typically EEZ or planning area) */
  outerArea: number,
  includePercMetric: boolean = true
): Promise<SimpleSketchMetric[]> {
  const percMetricId = `${metricId}Perc`;
  // Union to remove overlap
  const combinedSketch = isSketchCollection(sketch)
    ? clip(sketch.features, "union")
    : featureCollection([sketch]);

  if (!combinedSketch) throw new Error("areaStats - invalid sketch");
  const combinedSketchArea = turfArea(combinedSketch);

  let metrics: SimpleSketchMetric[] = [];
  if (sketch) {
    featureEach(sketch, (curSketch) => {
      if (!curSketch || !curSketch.properties) {
        console.log(
          "Warning: feature or its properties are undefined, skipped"
        );
      } else if (!curSketch.geometry) {
        console.log(
          `Warning: feature is missing geometry, zeroed: sketchId:${curSketch.properties.id}, name:${curSketch.properties.name}`
        );
        metrics.push({
          metricId,
          sketchId: curSketch.properties.id,
          value: 0,
          extra: {
            sketchName: curSketch.properties.name,
          },
        });
        if (includePercMetric) {
          metrics.push({
            metricId: percMetricId,
            sketchId: curSketch.properties.id,
            value: 0,
            extra: {
              sketchName: curSketch.properties.name,
            },
          });
        }
      } else {
        const sketchArea = turfArea(curSketch);
        metrics.push({
          metricId,
          sketchId: curSketch.properties.id,
          value: sketchArea,
          extra: {
            sketchName: curSketch.properties.name,
          },
        });
        if (includePercMetric) {
          metrics.push({
            metricId: percMetricId,
            sketchId: curSketch.properties.id,
            value: sketchArea / outerArea,
            extra: {
              sketchName: curSketch.properties.name,
            },
          });
        }
      }
    });
  }

  if (isSketchCollection(sketch)) {
    metrics.push({
      metricId,
      sketchId: sketch.properties.id,
      value: combinedSketchArea,
      extra: {
        sketchName: sketch.properties.name,
        isCollection: true,
      },
    });
    metrics.push({
      metricId: percMetricId,
      sketchId: sketch.properties.id,
      value: combinedSketchArea / outerArea,
      extra: {
        sketchName: sketch.properties.name,
        isCollection: true,
      },
    });
  }

  return metrics;
}

/**
 * Returns area stats for sketch input after performing overlay operation against a subarea feature.
 * Includes both area overlap and percent area overlap metrics, because calculating percent later would be too complicated
 * For sketch collections, dissolve is used when calculating total sketch area to prevent double counting
 */
export async function overlapSubarea(
  /** Metric identifier */
  metricId: string,
  /** Single sketch or collection */
  sketch: Sketch<Polygon> | SketchCollection<Polygon>,
  /** subarea feature */
  subareaFeature: Feature<Polygon | MultiPolygon> | Polygon | MultiPolygon,
  options?: {
    /** operation to perform on sketch in relation to sub area features, defaults to 'intersection' */
    operation?: "intersect" | "difference";
    /** area of outer boundary.  Use for total area of the subarea for intersection when you don't have the whole feature, or use for the total area of the boundar outside of the subarea for difference (typically EEZ or planning area) */
    outerArea?: number | undefined;
  }
): Promise<SimpleSketchMetric[]> {
  const percMetricId = `${metricId}Perc`;
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

  let metrics: SimpleSketchMetric[] = [];
  if (subsketches) {
    subsketches.forEach((feat, index) => {
      const origSketch = sketches[index];
      if (feat) {
        const subsketchArea = turfArea(feat);
        metrics.push({
          metricId,
          sketchId: origSketch.properties.id,
          value: subsketchArea,
          extra: {
            sketchName: origSketch.properties.name,
          },
        });
        metrics.push({
          metricId: percMetricId,
          sketchId: origSketch.properties.id,
          value: subsketchArea === 0 ? 0 : subsketchArea / operationArea,
          extra: {
            sketchName: origSketch.properties.name,
          },
        });
      } else {
        metrics.push({
          metricId,
          sketchId: origSketch.properties.id,
          value: 0,
          extra: {
            sketchName: origSketch.properties.name,
          },
        });
        metrics.push({
          metricId: percMetricId,
          sketchId: origSketch.properties.id,
          value: 0,
          extra: {
            sketchName: origSketch.properties.name,
          },
        });
      }
    });
  }

  if (isSketchCollection(sketch)) {
    metrics.push({
      metricId,
      sketchId: sketch.properties.id,
      value: subsketchArea,
      extra: {
        sketchName: sketch.properties.name,
        isCollection: true,
      },
    });
    metrics.push({
      metricId: percMetricId,
      sketchId: sketch.properties.id,
      value: subsketchArea === 0 ? 0 : subsketchArea / operationArea,
      extra: {
        sketchName: sketch.properties.name,
        isCollection: true,
      },
    });
  }

  return metrics;
}
