import {
  Sketch,
  SketchCollection,
  GeoprocessingHandler,
  sketchArea,
  Feature,
  Polygon,
  LineString,
  Point,
  isFeatureCollection,
  fgbFetchAll,
} from "@seasketch/geoprocessing";
import bbox from "@turf/bbox";
import { featureCollection } from "@turf/helpers";
import config, { HabitatRestoreResults } from "../_config";

export async function habitatRestore(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<HabitatRestoreResults> {
  const sketchColl = isFeatureCollection(sketch)
    ? sketch
    : featureCollection([sketch]);
  const box = sketch.bbox || bbox(sketch);

  // const restoreFeatures = await Promise.all(
  //   config.habitatRestore.layers.map((lyr) => {
  //     return fgbFetchAll<Feature<Polygon | LineString | Point>>(
  //       `${config.dataBucketUrl}${lyr.filename}`,
  //       box
  //     );
  //   })
  // );

  return {
    restore: config.habitatRestore.layers.reduce(
      (acc, lyr) => ({
        ...acc,
        [lyr.baseFilename]: {
          name: lyr.baseFilename,
          value: 20,
          percValue: 0.2,
          sketchMetrics: sketchColl.features.map((sk) => ({
            id: sk.properties.id,
            name: sk.properties.name,
            value: 2,
            percValue: 0.025,
          })),
        },
      }),
      {}
    ),
  };
}

export default new GeoprocessingHandler(habitatRestore, {
  title: "habitatRestore",
  description: "habitat restoration area within sketch",
  timeout: 2, // seconds
  executionMode: "async",
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
});
