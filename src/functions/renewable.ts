import {
  Sketch,
  SketchCollection,
  GeoprocessingHandler,
  Polygon,
  loadCogWindow,
  toNullSketch,
} from "@seasketch/geoprocessing";
import bbox from "@turf/bbox";
import config, { RenewableResult } from "../_config";
import { overlapRaster } from "../metrics/overlapRasterNext";
import { ExtendedSketchMetric } from "../metrics/types";

const CLASSES = config.renewable.classes;

export async function renewable(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<RenewableResult> {
  const box = sketch.bbox || bbox(sketch);

  // Calc metrics for each class and merge the result
  const metrics: ExtendedSketchMetric[] = (
    await Promise.all(
      CLASSES.map(async (curClass) => {
        const raster = await loadCogWindow(
          `${config.dataBucketUrl}${curClass.filename}`,
          {
            windowBox: box,
            noDataValue: curClass.noDataValue,
          }
        );
        const overlapResult = await overlapRaster("renewable", raster, sketch);
        return overlapResult.map(
          (metrics): ExtendedSketchMetric => ({
            reportId: "renewable",
            classId: curClass.classId,
            ...metrics,
          })
        );
      })
    )
  ).reduce(
    // merge
    (metricsSoFar, curClassMetrics) => [...metricsSoFar, ...curClassMetrics],
    []
  );

  return {
    metrics,
    sketch: toNullSketch(sketch, true),
  };
}

export default new GeoprocessingHandler(renewable, {
  title: "renewable",
  description: "high quality reef protection metrics",
  timeout: 240, // seconds
  executionMode: "async",
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
  memory: 8192,
});
