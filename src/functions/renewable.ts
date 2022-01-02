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
        // start load for class and move on to next while awaiting finish
        const raster = await loadCogWindow(
          `${config.dataBucketUrl}${curClass.filename}`,
          {
            windowBox: box,
            noDataValue: curClass.noDataValue,
          }
        );
        // start analysis as soon as source load done
        const overlapResult = await overlapRaster("renewable", raster, sketch);
        // merge remaining IDs
        return overlapResult.map(
          (classMetrics): ExtendedSketchMetric => ({
            reportId: "renewable",
            classId: curClass.classId,
            ...classMetrics,
          })
        );
      })
    )
  ).reduce(
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
