import { Polygon, Sketch, Georaster } from "@seasketch/geoprocessing";
import { ClassMetricsSketch, ClassMetricSketch, SketchMetric } from "./types";
import flatten from "@turf/flatten";
import { feature, featureCollection } from "@turf/helpers";
import { clip } from "../util/clip";
import area from "@turf/area";

// @ts-ignore
import geoblaze from "geoblaze";

/**
 * Calculates sum of overlap between sketches and feature classes in raster
 * Includes overall and per sketch for each class
 */
export async function overlapRasterClass(
  /** raster to search */
  raster: Georaster,
  config: {
    /** Map from class ID to class name */
    classIdToName: Record<string, string>;
    /** Map from class ID to precalculate class total in raster */
    classIdToTotal: Record<string, number>;
  },
  /** Optional polygon sketches, if present will calculate overlap for the features  */
  sketches?: Sketch<Polygon>[]
): Promise<ClassMetricsSketch> {
  if (!config.classIdToName || !config.classIdToTotal)
    throw new Error("Missing classIdToName map in config");

  // overallHistograms account for sketch overlap, sketchHistograms do not
  // histogram will exclude a class in result if not in raster, rather than return zero
  // histogram will be undefined if no raster cells are found within sketch feature
  // ToDo: this function should normalize the result to include zeros, rather than downstream
  const { sketchHistograms, overallHistograms } = (() => {
    let overallHistograms: any[] = [];
    let sketchHistograms: any[] = [];
    if (sketches) {
      // Get histogram for each feature
      // If feature overlap, remove with union
      const sketchColl = featureCollection(sketches);
      const sketchArea = area(sketchColl);
      const featureUnion = clip(sketches, "union");
      if (!featureUnion)
        throw new Error("rasterClassStats - something went wrong");
      const featureUnionArea = area(featureUnion);
      const isOverlap = featureUnionArea < sketchArea;

      const remsketches = isOverlap ? flatten(featureUnion).features : sketches;

      // Get count of unique cell IDs in each feature
      overallHistograms = remsketches.map((feature) => {
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

  const classIds = Object.keys(config.classIdToName);
  // Initialize the counts by class to 0
  let countByClass = classIds.reduce<Record<string, number>>(
    (acc, classId) => ({
      ...acc,
      [classId]: 0,
    }),
    {}
  );

  // Sum the counts by class for each histogram
  overallHistograms.forEach((overallHist) => {
    if (!overallHist) {
      return; // skip undefined result
    }
    classIds.forEach((classId) => {
      if (classIds.includes(classId)) {
        countByClass[classId] += overallHist[classId] || 0;
      }
    });
  });

  // Sum the counts by class for each histogram
  // Initialize the sketch metrics by class to empty
  let sketchMetricsByClass = classIds.reduce<Record<string, SketchMetric[]>>(
    (acc, classId) => ({
      ...acc,
      [classId]: [],
    }),
    {}
  );
  if (sketches) {
    sketchHistograms.forEach((sketchHist, index) => {
      if (!sketchHist) {
        // push zero result for sketch for all classes
        classIds.forEach((classId) =>
          sketchMetricsByClass[classId].push({
            id: sketches[index].properties.id,
            name: sketches[index].properties.name,
            value: 0,
            percValue: 0,
          })
        );
      } else {
        classIds.forEach((classId) => {
          if (classIds.includes(classId)) {
            sketchMetricsByClass[classId].push({
              id: sketches[index].properties.id,
              name: sketches[index].properties.name,
              value: sketchHist[classId] || 0,
              percValue: sketchHist[classId]
                ? sketchHist[classId] / config.classIdToTotal[classId]
                : 0,
            });
          }
        });
      }
    });
  }

  return Object.keys(countByClass).reduce((metricsSoFar, classId) => {
    return {
      ...metricsSoFar,
      [config.classIdToName[classId]]: {
        name: config.classIdToName[classId],
        value: countByClass[classId],
        percValue: countByClass[classId] / config.classIdToTotal[classId],
        sketchMetrics: sketchMetricsByClass[classId],
      },
    };
  }, {});
}
