import { Polygon, Feature, Georaster } from "@seasketch/geoprocessing";
import { ClassMetricsSketch } from "./types";
import flatten from "@turf/flatten";
import { featureCollection } from "@turf/helpers";
import dissolve from "@turf/dissolve";
import area from "@turf/area";

// @ts-ignore
import geoblaze from "geoblaze";

/**
 * Returns sum metric for all classes within a single raster.
 * Conveniently bundles into result the class name and perc of total
 */
export async function rasterClassStats(
  /** raster to search */
  raster: Georaster,
  config: {
    /** Map from class ID to class name */
    classIdToName: Record<string, string>;
    /** Map from class ID to precalculate class total in raster */
    classIdToTotal: Record<string, number>;
  },
  /** Optional polygon features, if present will calculate overlap for the features and not load the whole raster, otherwise calculates for whole raster  */
  features?: Feature<Polygon>[]
): Promise<ClassMetricsSketch> {
  if (!config.classIdToName || !config.classIdToTotal)
    throw new Error("Missing classIdToName map in config");

  const histograms = (() => {
    if (features) {
      // If feature overlap, calculate histograms from dissolved features
      const sketchColl = featureCollection(features);
      const sketchArea = area(sketchColl);
      const dissolvedFeatures = dissolve(sketchColl);
      const combinedArea = area(dissolvedFeatures);
      const isOverlap = combinedArea < sketchArea;
      const remFeatures = isOverlap ? dissolvedFeatures.features : features;

      // Get count of unique cell IDs in each feature
      return remFeatures.map((feature) => {
        return geoblaze.histogram(raster, feature, {
          scaleType: "nominal",
        })[0];
      });
    } else {
      // Get histogram for whole raster
      return [
        geoblaze.histogram(raster, undefined, {
          scaleType: "nominal",
        })[0],
      ];
    }
  })();

  const ids = Object.keys(config.classIdToName);
  // Initialize the counts by class to 0
  let countByClass = ids.reduce<Record<string, number>>(
    (acc, classId) => ({
      ...acc,
      [classId]: 0,
    }),
    {}
  );

  // Sum the counts by class for each histogram
  histograms.forEach((hist) => {
    if (!hist) return; // skip undefined result
    Object.keys(hist).forEach((classId) => {
      if (ids.includes(classId)) {
        countByClass[classId] += hist[classId];
      }
    });
  });

  return Object.keys(countByClass).reduce((metrics, classId) => {
    return {
      ...metrics,
      [config.classIdToName[classId]]: {
        name: config.classIdToName[classId],
        value: countByClass[classId],
        percValue: countByClass[classId] / config.classIdToTotal[classId],
        sketchMetrics: [], // ToDo
      },
    };
  }, {});
}
