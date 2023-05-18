// Run inside workspace
// Precalculates overall stats used by habitat protection function

import fs from "fs";
import config from "../src/_config";
import {
  Metric,
  ReportResultBase,
  createMetric,
  rekeyMetrics,
} from "@seasketch/geoprocessing";
import { loadCogWindow } from "../src/datasources/cog";
// @ts-ignore
import geoblaze from "geoblaze";

const REPORT = config.habitatProtectionOffshore;
const METRIC = REPORT.metrics.offshoreAreaOverlap;
const DEST_PATH = `${__dirname}/precalc/offshoreHabitatTotals.json`;

async function main() {
  const metrics: Metric[] = await Promise.all(
    METRIC.classes.map(async (curClass) => {
      const url = `${config.localDataUrl}${curClass.filename}`;
      const raster = await loadCogWindow(url, {
        noDataValue: curClass.noDataValue,
      }); // Load whole raster
      const sum = geoblaze.sum(raster)[0] as number;
      return createMetric({
        classId: curClass.classId,
        metricId: METRIC.metricId,
        value: sum,
      });
    })
  );

  const result: ReportResultBase = {
    metrics: rekeyMetrics(metrics),
  };

  fs.writeFile(DEST_PATH, JSON.stringify(result, null, 2), (err) =>
    err
      ? console.error("Error", err)
      : console.info(`Successfully wrote ${DEST_PATH}`)
  );
}

main();
