// Run inside workspace
// Precalculates overall stats used by habitat protection function

import fs from "fs";
import config from "../src/_config";
import { ReportMetric } from "../src/metrics/types";
import { ReportResultBase } from "../src/_config";
// @ts-ignore
import geoblaze from "geoblaze";
import { loadCogWindow } from "../src/datasources/cog";

const DEST_PATH = `${__dirname}/precalc/offshoreHabitatTotals.json`;
const CONFIG = config.offshore;
const REPORT_ID = "habitatProtection";
const METRIC_ID = "offshore";

async function main() {
  const metrics: ReportMetric[] = await Promise.all(
    CONFIG.classes.map(async (curClass) => {
      const url = `${config.localDataUrl}${curClass.filename}`;
      const raster = await loadCogWindow(url, {
        noDataValue: curClass.noDataValue,
      }); // Load whole raster
      const sum = geoblaze.sum(raster)[0] as number;
      return {
        reportId: REPORT_ID,
        classId: curClass.classId,
        metricId: METRIC_ID,
        value: sum,
      };
    })
  );

  const result: ReportResultBase = {
    metrics,
  };

  fs.writeFile(DEST_PATH, JSON.stringify(result, null, 2), (err) =>
    err
      ? console.error("Error", err)
      : console.info(`Successfully wrote ${DEST_PATH}`)
  );
}

main();
