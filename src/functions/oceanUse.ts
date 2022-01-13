import {
  Sketch,
  SketchCollection,
  GeoprocessingHandler,
  Polygon,
  loadCogWindow,
  toNullSketch,
} from "@seasketch/geoprocessing";
import bbox from "@turf/bbox";
import { overlapRaster } from "../metrics/overlapRaster";
import { ReportSketchMetric } from "../metrics/types";
import config, { MetricResult } from "../_config";

const CONFIG = config.oceanUse;
const REPORT_ID = "oceanUse";
const METRIC_ID = "valueOverlap";

export async function oceanUse(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<MetricResult> {
  const box = sketch.bbox || bbox(sketch);
  const metrics: ReportSketchMetric[] = (
    await Promise.all(
      CONFIG.classes.map(async (curClass) => {
        // start raster load and move on in loop while awaiting finish
        const raster = await loadCogWindow(
          `${config.dataBucketUrl}${curClass.filename}`,
          {
            windowBox: box,
          }
        );
        // start analysis as soon as source load done
        const overlapResult = await overlapRaster(METRIC_ID, raster, sketch);
        return overlapResult.map(
          (metrics): ReportSketchMetric => ({
            reportId: REPORT_ID,
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

export default new GeoprocessingHandler(oceanUse, {
  title: "oceanUse",
  description: "ocean use survey stats",
  timeout: 180, // seconds
  executionMode: "async",
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
  memory: 8192,
});
