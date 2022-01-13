import {
  Sketch,
  SketchCollection,
  GeoprocessingHandler,
  Polygon,
  loadCogWindow,
  toNullSketch,
} from "@seasketch/geoprocessing";
import bbox from "@turf/bbox";
import config, { MetricResult } from "../_config";
import { overlapRaster } from "../metrics/overlapRaster";
import { ReportSketchMetric } from "../metrics/types";

const CONFIG = config.reefIndex;
const REPORT_ID = "oceanUse";
const METRIC_ID = "valueOverlap";

export async function reefIndex(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<MetricResult> {
  const box = sketch.bbox || bbox(sketch);

  const rasters = await Promise.all(
    CONFIG.classes.map((curClass) =>
      loadCogWindow(`${config.dataBucketUrl}${curClass.filename}`, {
        windowBox: box,
        noDataValue: curClass.noDataValue,
      })
    )
  );

  const metrics = (
    await Promise.all(
      rasters.map(async (raster, index) => {
        const curClass = CONFIG.classes[index];
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

export default new GeoprocessingHandler(reefIndex, {
  title: "reefIndex",
  description: "high quality reef protection metrics",
  timeout: 300, // seconds
  executionMode: "async",
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
  memory: 8192,
});
