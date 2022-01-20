// Run inside workspace
// Precalculates overall stats used by habitat protection function

import fs from "fs";
import config from "../src/_config";
import { Metric } from "../src/metrics/types";
import { ReportResultBase } from "../src/_config";
// @ts-ignore
import geoblaze from "geoblaze";
import { loadCogWindow } from "../src/datasources/cog";
import { createMetric, metricRekey } from "../src/metrics/metrics";

const DEST_PATH = `${__dirname}/precalc/offshoreHabitatTotals.json`;
const CONFIG = config.offshore;
const METRIC_ID = "offshore";

async function main() {
  const metrics: Metric[] = await Promise.all(
    CONFIG.classes.map(async (curClass) => {
      const url = `${config.localDataUrl}${curClass.filename}`;
      const raster = await loadCogWindow(url, {
        noDataValue: curClass.noDataValue,
      }); // Load whole raster
      const sum = geoblaze.sum(raster)[0] as number;
      return createMetric({
        classId: curClass.classId,
        metricId: METRIC_ID,
        value: sum,
      });
    })
  );

  const result: ReportResultBase = {
    metrics: metricRekey(metrics),
  };

  fs.writeFile(DEST_PATH, JSON.stringify(result, null, 2), (err) =>
    err
      ? console.error("Error", err)
      : console.info(`Successfully wrote ${DEST_PATH}`)
  );
}

main();
