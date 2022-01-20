import {
  Sketch,
  SketchCollection,
  GeoprocessingHandler,
  Polygon,
  loadCogWindow,
  toNullSketch,
} from "@seasketch/geoprocessing";
import bbox from "@turf/bbox";
import config, { ReportResult } from "../_config";
import { overlapRaster } from "../metrics/overlapRaster";
import { Metric } from "../metrics/types";
import { metricRekey, metricSort } from "../metrics/metrics";

const CONFIG = config.renewable;
const REPORT_ID = "renewable";
const METRIC_ID = "areaOverlap";

export async function renewable(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<ReportResult> {
  const box = sketch.bbox || bbox(sketch);

  // Calc metrics for each class and merge the result
  const metrics: Metric[] = (
    await Promise.all(
      CONFIG.classes.map(async (curClass) => {
        const raster = await loadCogWindow(
          `${config.dataBucketUrl}${curClass.filename}`,
          {
            windowBox: box,
            noDataValue: curClass.noDataValue,
          }
        );
        const overlapResult = await overlapRaster(METRIC_ID, raster, sketch);
        return overlapResult.map(
          (metrics): Metric => ({
            ...metrics,
            classId: curClass.classId,
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
    metrics: metricSort(metricRekey(metrics)),
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
