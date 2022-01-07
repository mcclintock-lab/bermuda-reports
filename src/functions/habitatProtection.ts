import {
  Sketch,
  SketchCollection,
  GeoprocessingHandler,
  Polygon,
  toSketchArray,
  loadCogWindow,
  keyBy,
  toNullSketch,
} from "@seasketch/geoprocessing";
import bbox from "@turf/bbox";
import config, { HabitatResult } from "../_config";
import { overlapRasterClass } from "../metrics/overlapRasterClass";
import { overlapRaster } from "../metrics/overlapRasterNext";
import { metricSort } from "../metrics/metrics";

import { groupClassIdMapping } from "../metrics/classId";
import { ExtendedSketchMetric } from "../metrics/types";

const OFFSHORE_CLASSES = config.offshore.classes;
const REPORT_ID = "habitatProtection";
const NEARSHORE_METRIC_ID = "nearshore";
const OFFSHORE_METRIC_ID = "offshore";

export async function habitatProtection(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<HabitatResult> {
  const sketches = toSketchArray(sketch);
  const box = sketch.bbox || bbox(sketch);

  // Categorical raster - multi-class
  const nearshoreRaster = await loadCogWindow(
    `${config.dataBucketUrl}${config.nearshore.filename}`,
    { windowBox: box }
  );
  const nearshoreMetrics: ExtendedSketchMetric[] = (
    await overlapRasterClass(NEARSHORE_METRIC_ID, nearshoreRaster, sketch, {
      classIdMapping: groupClassIdMapping(config.nearshore),
    })
  ).map((metrics) => ({
    reportId: REPORT_ID,
    ...metrics,
  }));

  // Individual rasters - single-class
  const offshoreMetrics: ExtendedSketchMetric[] = (
    await Promise.all(
      OFFSHORE_CLASSES.map(async (curClass) => {
        const raster = await loadCogWindow(
          `${config.dataBucketUrl}${curClass.filename}`,
          {
            windowBox: box,
            noDataValue: curClass.noDataValue,
          }
        );
        const overlapResult = await overlapRaster(
          OFFSHORE_METRIC_ID,
          raster,
          sketch
        );
        return overlapResult.map(
          (metrics): ExtendedSketchMetric => ({
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
    metrics: metricSort([...nearshoreMetrics, ...offshoreMetrics]),
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
