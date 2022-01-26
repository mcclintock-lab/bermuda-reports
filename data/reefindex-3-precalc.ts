// Run inside workspace
// Precalculates overall stats used by habitat function

import fs from "fs";
import config from "../src/_config";
// @ts-ignore
import geoblaze from "geoblaze";
// @ts-ignore
import parseGeoraster from "georaster";
import fetch from "node-fetch";
import { Metric } from "../src/metrics/types";
import { ReportResultBase } from "../src/_config";
import { createMetric, rekeyMetrics } from "../src/metrics/helpers";

const REPORT = config.speciesProtection;
const METRIC = REPORT.metrics.valueOverlap;

async function main() {
  const DEST_PATH = `${__dirname}/precalc/${METRIC.datasourceId}Totals.json`;
  const metrics: Metric[] = await Promise.all(
    METRIC.classes.map(async (curClass) => {
      const url = `${config.localDataUrl}${curClass.filename}`;
      const response = await fetch(url);
      const rasterBuf = await response.arrayBuffer();
      const raster = await parseGeoraster(rasterBuf);
      const value = geoblaze.sum(raster)[0] as number;
      return createMetric({
        classId: curClass.classId,
        metricId: METRIC.metricId,
        value,
      });
    })
  );

  const result: ReportResultBase = { metrics: rekeyMetrics(metrics) };

  fs.writeFile(DEST_PATH, JSON.stringify(result, null, 2), (err) =>
    err
      ? console.error("Error", err)
      : console.info(`Successfully wrote ${DEST_PATH}`)
  );
}

main();
