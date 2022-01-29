import {
  Sketch,
  SketchCollection,
  GeoprocessingHandler,
  Polygon,
  Metric,
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
import config, { ReportResult } from "../_config";

const REPORT = config.habitatProtection;
const NEARSHORE_METRIC = REPORT.metrics.nearshoreAreaOverlap;
const OFFSHORE_METRIC = REPORT.metrics.offshoreAreaOverlap;

export async function habitatProtection(
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

  // Individual rasters - single-class
  const offshoreMetrics: Metric[] = (
    await Promise.all(
      OFFSHORE_METRIC.classes.map(async (curClass) => {
        const raster = await loadCogWindow(
          `${config.dataBucketUrl}${curClass.filename}`,
          {
            windowBox: box,
            noDataValue: curClass.noDataValue,
          }
        );
        const overlapResult = await overlapRaster(
          OFFSHORE_METRIC.metricId,
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
    metrics: sortMetrics(
      rekeyMetrics([...nearshoreMetrics, ...offshoreMetrics])
    ),
    sketch: toNullSketch(sketch, true),
  };
}

export default new GeoprocessingHandler(habitatProtection, {
  title: "habitatProtection",
  description: "habitat protection metrics",
  timeout: 240, // seconds
  executionMode: "async",
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
  memory: 8192,
});
