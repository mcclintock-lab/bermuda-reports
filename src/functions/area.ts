import {
  Sketch,
  SketchCollection,
  Feature,
  Polygon,
  GeoprocessingHandler,
  fgbFetchAll,
  toNullSketch,
} from "@seasketch/geoprocessing";
import { overlapArea, overlapSubarea } from "../metrics/overlapArea";
import config, { STUDY_REGION_AREA_SQ_METERS, ReportResult } from "../_config";
import bbox from "@turf/bbox";
import { Metric } from "../metrics/types";
import { metricRekey, metricSort } from "../metrics/metrics";

const CONFIG = config;
const REPORT = CONFIG.size;
const METRIC = REPORT.metrics.areaOverlap;
if (!CONFIG || !REPORT || !METRIC)
  throw new Error("Problem accessing report config");

export async function area(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<ReportResult> {
  const box = sketch.bbox || bbox(sketch);
  const nearshorePolys = await fgbFetchAll<Feature<Polygon>>(
    `${CONFIG.dataBucketUrl}${METRIC.filename}`,
    box
  );

  const metrics: Metric[] = (
    await Promise.all(
      METRIC.classes.map(async (curClass) => {
        let overlapResult: Metric[] = [];
        switch (curClass.classId) {
          case "eez":
            overlapResult = await overlapArea(
              METRIC.metricId,
              sketch,
              STUDY_REGION_AREA_SQ_METERS
            );
            break;
          case "nearshore":
            overlapResult = await overlapSubarea(
              METRIC.metricId,
              sketch,
              nearshorePolys[0]
            );
            break;
          case "offshore":
            overlapResult = await overlapSubarea(
              METRIC.metricId,
              sketch,
              nearshorePolys[0],
              {
                operation: "difference",
                outerArea: STUDY_REGION_AREA_SQ_METERS,
              }
            );
            break;
          default:
            throw new Error("unknown class");
        }
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
    metrics: metricSort(metricRekey(metrics)),
    sketch: toNullSketch(sketch, true),
  };
}

export default new GeoprocessingHandler(area, {
  title: "area",
  description: "Calculates area stats",
  timeout: 120, // seconds
  executionMode: "async",
  // Specify any Sketch Class form attributes that are required
  memory: 8192,
  requiresProperties: [],
});
