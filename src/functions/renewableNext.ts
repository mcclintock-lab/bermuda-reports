import {
  Sketch,
  SketchCollection,
  GeoprocessingHandler,
  Polygon,
  loadCogWindow,
  keyBy,
} from "@seasketch/geoprocessing";
import bbox from "@turf/bbox";
import config, { RenewableResults } from "../_config";
import { overlapRaster } from "../metrics/overlapRasterNext";
import renewableTotals from "../../data/precalc/renewableTotals.json";
import { SketchMetricSet } from "../metrics/types";

const precalcTotals = renewableTotals as Record<string, number>;
const CLASSES = config.renewable.classes;

export async function renewable(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<RenewableResults> {
  const box = sketch.bbox || bbox(sketch);

  // Calc metrics for each class and merge the result
  const metrics: SketchMetricSet[] = (
    await Promise.all(
      CLASSES.map(async (curClass) => {
        // start load for class and move on to next while awaiting finish
        const raster = await loadCogWindow(
          `${config.dataBucketUrl}${curClass.filename}`,
          {
            windowBox: box,
            noDataValue: curClass.noDataValue,
          }
        );
        // start analysis as soon as source load done
        const overlapResult = await overlapRaster(raster, sketch);
        // merge remaining IDs
        return overlapResult.map((classMetrics) => ({
          ...classMetrics,
          metricId: "renewable",
          classId: curClass.name,
        }));
      })
    )
  ).reduce(
    (metricsSoFar, curClassMetrics) => [...metricsSoFar, ...curClassMetrics],
    []
  );

  return {
    renewable: metrics,
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
