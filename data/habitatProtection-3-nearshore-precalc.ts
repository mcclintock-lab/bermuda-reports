import fs from "fs";
import config from "../src/_config";
// @ts-ignore
import { loadCogWindow } from "../src/datasources/cog";
// @ts-ignore
import geoblaze from "geoblaze";
import { Georaster } from "@seasketch/geoprocessing";
import { groupClassIdMapping } from "../src/metrics/classId";
import { Metric } from "../src/metrics/types";
import { ReportResultBase } from "../src/_config";
import { createMetric, metricRekey } from "../src/metrics/metrics";

const REPORT = config.habitatProtection;
const METRIC = REPORT.metrics.nearshoreAreaOverlap;
const DEST_PATH = `${__dirname}/precalc/nearshoreHabitatTotals.json`;

async function main() {
  const url = `${config.localDataUrl}${METRIC.filename}`;

  try {
    const raster = await loadCogWindow(url, {}); // Load wole raster
    const metrics: Metric[] = await countByClass(raster, {
      classIdToName: groupClassIdMapping(METRIC),
    });

    const result: ReportResultBase = {
      metrics: metricRekey(metrics),
    };

    fs.writeFile(DEST_PATH, JSON.stringify(result, null, 2), (err) =>
      err
        ? console.error("Error", err)
        : console.info(`Successfully wrote ${DEST_PATH}`)
    );
  } catch (err) {
    throw new Error(
      `raster fetch failed, did you start-data? Is this url correct? ${url}`
    );
  }
}

(async function () {
  await main();
})().catch(console.error);

/**
 * Implements the raster-based areaByClass calculation
 * ToDo: migrate to overlapRasterClass non-sketch
 */
async function countByClass(
  /** raster to search */
  raster: Georaster,
  config: { classIdToName: Record<string, string> }
): Promise<Metric[]> {
  if (!config.classIdToName)
    throw new Error("Missing classIdToName map in config");

  const histogram = geoblaze.histogram(raster, undefined, {
    scaleType: "nominal",
  })[0];

  const numericClassIds = Object.keys(config.classIdToName);

  // Migrate the total counts, skip nodata
  let metrics: Metric[] = [];
  numericClassIds.forEach((numericClassId) => {
    if (numericClassIds.includes(numericClassId) && histogram[numericClassId]) {
      metrics.push(
        createMetric({
          metricId: METRIC.metricId,
          classId: config.classIdToName[numericClassId],
          value: histogram[numericClassId],
        })
      );
    } else {
      metrics.push(
        createMetric({
          metricId: METRIC.metricId,
          classId: config.classIdToName[numericClassId],
          value: 0,
        })
      );
    }
  });

  return metrics;
}
