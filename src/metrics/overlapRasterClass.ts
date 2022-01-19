import {
  Polygon,
  Sketch,
  SketchCollection,
  Georaster,
  toSketchArray,
  isSketchCollection,
} from "@seasketch/geoprocessing";
import { ClassSketchMetric } from "./types";
import flatten from "@turf/flatten";
import { clip } from "../util/clip";
import area from "@turf/area";
import {
  removeSketchPolygonHoles,
  removeSketchCollPolygonHoles,
} from "../util/removeHoles";

// @ts-ignore
import geoblaze from "geoblaze";

/**
 * Calculates sum of overlap between sketches and feature classes in raster
 * Includes overall and per sketch for each class
 */
export async function overlapRasterClass(
  metricId: string,
  /** raster to search */
  raster: Georaster,
  /** single sketch or collection. */
  sketch: Sketch<Polygon> | SketchCollection<Polygon>,
  options: {
    /** Map from numeric class ID to string */
    classIdMapping: Record<string, string>;
    /** Whether to remove holes from sketch polygons. Geoblaze can overcount with them. Default to true */
    removeSketchHoles?: boolean;
  } = { classIdMapping: {}, removeSketchHoles: true }
): Promise<ClassSketchMetric[]> {
  if (!options.classIdMapping)
    throw new Error("Missing classIdMapping in config");
  const sketches = toSketchArray(sketch);
  const sketchArea = area(sketch);
  const classIds = Object.keys(options.classIdMapping);

  // overallHistograms account for sketch overlap, sketchHistograms do not
  // histogram will exclude a class in result if not in raster, rather than return zero
  // histogram will be undefined if no raster cells are found within sketch feature
  const { sketchHistograms, overallHistograms } = (() => {
    let overallHistograms: any[] = [];
    let sketchHistograms: any[] = [];
    if (sketch) {
      // Get histogram for each feature
      // If feature overlap, remove with union
      // Optionally remove polygon holes (geoblaze polygon hole bug)

      const holeSketches = (() => {
        if (options.removeSketchHoles) {
          if (isSketchCollection(sketch)) {
            return removeSketchCollPolygonHoles(sketch);
          } else {
            return [removeSketchPolygonHoles(sketch)];
          }
        }
        return sketches;
      })();

      const sketchUnion = clip(holeSketches, "union");
      if (!sketchUnion)
        throw new Error(`rasterClassStats ${metricId} - something went wrong`);
      const sketchUnionArea = area(sketchUnion);
      const isOverlap = sketchUnionArea < sketchArea;
      const clippedSketches = isOverlap
        ? flatten(sketchUnion).features
        : sketches;

      // Get count of unique cell IDs in each feature
      overallHistograms = clippedSketches.map((feature) => {
        return geoblaze.histogram(raster, feature, {
          scaleType: "nominal",
        })[0];
      });

      sketchHistograms = sketches.map((feature) => {
        return geoblaze.histogram(raster, feature, {
          scaleType: "nominal",
        })[0];
      });
    } else {
      // Get histogram for whole raster
      const hist = geoblaze.histogram(raster, undefined, {
        scaleType: "nominal",
      })[0];
      // If there are no sketches, then they are the same
      overallHistograms = [hist];
      sketchHistograms = [hist];
    }

    return {
      sketchHistograms,
      overallHistograms,
    };
  })();

  let sketchMetrics: ClassSketchMetric[] = [];

  if (sketches) {
    sketchHistograms.forEach((sketchHist, index) => {
      if (!sketchHist) {
        // push zero result for sketch for all classes
        classIds.forEach((classId) =>
          sketchMetrics.push({
            metricId,
            classId: options.classIdMapping[classId],
            sketchId: sketches[index].properties.id,
            value: 0,
            extra: {
              sketchName: sketches[index].properties.name,
            },
          })
        );
      } else {
        classIds.forEach((classId) => {
          if (classIds.includes(classId)) {
            sketchMetrics.push({
              metricId,
              classId: options.classIdMapping[classId],
              sketchId: sketches[index].properties.id,
              value: sketchHist[classId] || 0,
              extra: {
                sketchName: sketches[index].properties.name,
              },
            });
          }
        });
      }
    });
  }

  // Sum the counts by class for each histogram
  if (isSketchCollection(sketch)) {
    const sumByClass: Record<string, number> = {};
    overallHistograms.forEach((overallHist) => {
      if (!overallHist) {
        return; // skip undefined result
      }
      classIds.forEach((classId) => {
        const value = overallHist[classId] ? overallHist[classId] : 0;
        sumByClass[classId] = sumByClass[classId]
          ? sumByClass[classId] + value
          : value;
      });
    });

    classIds.forEach((classId) => {
      sketchMetrics.push({
        metricId,
        classId: options.classIdMapping[classId],
        sketchId: sketch.properties.id,
        value: sumByClass[classId] || 0,
        extra: {
          sketchName: sketch.properties.name,
          isCollection: true,
        },
      });
    });
  }

  return sketchMetrics;
}
