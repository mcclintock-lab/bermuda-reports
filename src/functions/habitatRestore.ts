import {
  Sketch,
  SketchCollection,
  Feature,
  GeoprocessingHandler,
  Metric,
  Polygon,
  ReportResult,
  toNullSketch,
  overlapFeatures,
  rekeyMetrics,
  sortMetrics,
} from "@seasketch/geoprocessing";
import bbox from "@turf/bbox";
import config from "../_config";
import { fgbFetchAll } from "@seasketch/geoprocessing/dataproviders";

const REPORT = config.habitatRestore;
const METRIC = REPORT.metrics.areaOverlap;

export async function habitatRestore(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<ReportResult> {
  const box = sketch.bbox || bbox(sketch);

  const metrics = (
    await Promise.all(
      METRIC.classes.map(async (curClass) => {
        const features = await fgbFetchAll<Feature<Polygon>>(
          `${config.dataBucketUrl}${curClass.filename}`,
          box
        );
        const overlapResult = await overlapFeatures(
          METRIC.metricId,
          features,
          sketch,
          {
            chunkSize: 2000,
          }
        );
        // Transform from simple to extended metric
        return overlapResult.map(
          (metric): Metric => ({
            ...metric,
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

export default new GeoprocessingHandler(habitatRestore, {
  title: "habitatRestore",
  description: "habitat restoration area within sketch",
  timeout: 900, // seconds
  executionMode: "async",
  memory: 10240,
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
});
