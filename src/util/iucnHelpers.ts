import { Sketch, getJsonUserAttribute } from "@seasketch/geoprocessing";
import {
  IucnCategoryCombined,
  getCategoryForActivities,
} from "./iucnProtectionLevel";

/**
 * Return Category for each sketch keyed by sketchId
 */
export const getCategoryForSketches = (sketches: Sketch[]) => {
  const sketchCategoryMap = sketches.reduce<
    Record<string, IucnCategoryCombined>
  >((acc, sketch) => {
    // Get sketch allowed activities, then category
    const activities: string[] = getJsonUserAttribute(sketch, "ACTIVITIES", []);
    const category = getCategoryForActivities(activities);
    return {
      ...acc,
      [sketch.properties.id]: category,
    };
  }, {});
  return sketchCategoryMap;
};

/**
 * Return Category name for each sketch keyed by sketchId
 */
export const getCategoryNameForSketches = (sketches: Sketch[]) => {
  const sketchCatMap = getCategoryForSketches(sketches);
  return Object.keys(sketchCatMap).reduce<Record<string, string>>(
    (sofar, sketchId) => ({
      ...sofar,
      [sketchId]: sketchCatMap[sketchId].level,
    }),
    {}
  );
};
