import {
  GeoprocessingHandler,
  Metric,
  Polygon,
  ReportResult,
  Sketch,
  SketchCollection,
  toSketchArray,
  toNullSketch,
  overlapRasterClass,
  overlapRaster,
  rekeyMetrics,
  sortMetrics,
  classIdMapping,
} from "@seasketch/geoprocessing";
import { loadCogWindow } from "@seasketch/geoprocessing/dataproviders";
import bbox from "@turf/bbox";
import config from "../_config";

const REPORT = config.habitatProtectionNearshore;
const NEARSHORE_METRIC = REPORT.metrics.nearshoreAreaOverlap;

export async function habitatProtectionNearshore(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<ReportResult> {
  const sketches = toSketchArray(sketch);
  const box = sketch.bbox || bbox(sketch);

  // Categorical raster - multi-class
  const nearshoreRaster = await loadCogWindow(
    `${config.dataBucketUrl}${NEARSHORE_METRIC.filename}`,
    { windowBox: box }
  );
  const nearshoreMetrics: Metric[] = (
    await overlapRasterClass(
      NEARSHORE_METRIC.metricId,
      nearshoreRaster,
      sketch,
      classIdMapping(NEARSHORE_METRIC.classes)
    )
  ).map((metrics) => ({
    ...metrics,
  }));

  return {
    metrics: sortMetrics(rekeyMetrics(nearshoreMetrics)),
    sketch: toNullSketch(sketch, true),
  };
}

export default new GeoprocessingHandler(habitatProtectionNearshore, {
  title: "habitatProtectionNearshore",
  description: "habitat protection nearshore metrics",
  timeout: 900, // seconds
  executionMode: "async",
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
  memory: 10240,
});
