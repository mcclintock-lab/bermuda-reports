import {
  Sketch,
  SketchCollection,
  Polygon,
  isSketchCollection,
} from "@seasketch/geoprocessing";
import { featureCollection } from "@turf/helpers";
import { featureEach } from "@turf/meta";
import turfArea from "@turf/area";
import dissolve from "@turf/dissolve";

export interface AreaResults {
  /** area in square meters */
  area: number;
  /** Percentage of the overall planning area */
  percPlanningArea: number;
  /** Area stats calculated per sketch */
  sketchAreas: {
    sketchId: string;
    area: number;
    percPlanningArea: number;
  }[];
  /** Unit of measurement for area value */
  areaUnit: string;
}

/**
 * Returns the overall area and area of each feature and its percentage of total area
 */
export async function area(
  feature: Sketch<Polygon> | SketchCollection<Polygon>,
  totalArea: number
): Promise<AreaResults> {
  //overall area
  const fc = isSketchCollection(feature)
    ? dissolve(feature)
    : featureCollection([feature]);
  const area = turfArea(fc);

  let sketchAreas: AreaResults["sketchAreas"] = [];
  featureEach(feature, (feat) => {
    const area = turfArea(feat);
    sketchAreas.push({
      sketchId: feat.properties.id,
      area,
      percPlanningArea: area / totalArea,
    });
  });

  return {
    area,
    percPlanningArea: area / totalArea,
    areaUnit: "square meters",
    sketchAreas,
  };
}
