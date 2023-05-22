import {
  GeoprocessingHandler,
  Metric,
  Polygon,
  ReportResult,
  Sketch,
  SketchCollection,
  toNullSketch,
  rekeyMetrics,
  sortMetrics,
  overlapRaster,
} from "@seasketch/geoprocessing";
import { loadCogWindow } from "@seasketch/geoprocessing/dataproviders";
import bbox from "@turf/bbox";
import config from "../_config";

const REPORT = config.oceanUseByGearType;
const METRIC = REPORT.metrics.valueOverlap;

export async function oceanUseByGearType(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<ReportResult> {
  const box = sketch.bbox || bbox(sketch);
  const metrics: Metric[] = (
    await Promise.all(
      METRIC.classes.map(async (curClass) => {
        // start raster load and move on in loop while awaiting finish
        const raster = await loadCogWindow(
          `${config.dataBucketUrl}${curClass.filename}`,
          {
            windowBox: box,
          }
        );
        // start analysis as soon as source load done
        const overlapResult = await overlapRaster(
          METRIC.metricId,
          raster,
          sketch
        );
        return overlapResult.map((curMetric): Metric => {
          // Removing geographyId and extra attributes for efficient memory usage
          // and fit within DynamoDB 400kb limit
          const { geographyId, extra, ...metric } = {
            ...curMetric,
            classId: curClass.classId,
          };

          return metric as Metric;
        });
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

export default new GeoprocessingHandler(oceanUseByGearType, {
  title: "oceanUseByGearType",
  description: "ocean use by gear type survey stats",
  timeout: 900, // seconds
  executionMode: "async",
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
  memory: 10240,
});
