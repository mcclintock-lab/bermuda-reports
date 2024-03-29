import {
  Sketch,
  SketchCollection,
  GeoprocessingHandler,
  Polygon,
  Metric,
  toNullSketch,
  overlapRaster,
  rekeyMetrics,
  sortMetrics,
  ReportResult,
} from "@seasketch/geoprocessing";
import { loadCogWindow } from "@seasketch/geoprocessing/dataproviders";
import bbox from "@turf/bbox";
import config from "../_config";

const REPORT = config.speciesProtection;
const METRIC = REPORT.metrics.valueOverlap;

export async function reefIndex(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<ReportResult> {
  const box = sketch.bbox || bbox(sketch);

  const rasters = await Promise.all(
    METRIC.classes.map((curClass) =>
      loadCogWindow(`${config.dataBucketUrl}${curClass.filename}`, {
        windowBox: box,
        noDataValue: curClass.noDataValue,
      })
    )
  );

  const metrics = (
    await Promise.all(
      rasters.map(async (raster, index) => {
        const curClass = METRIC.classes[index];
        const overlapResult = await overlapRaster(
          METRIC.metricId,
          raster,
          sketch
        );
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
    metrics: sortMetrics(rekeyMetrics(metrics)),
    sketch: toNullSketch(sketch, true),
  };
}

export default new GeoprocessingHandler(reefIndex, {
  title: "reefIndex",
  description: "high quality reef protection metrics",
  timeout: 900, // seconds
  executionMode: "async",
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
  memory: 10240,
});
