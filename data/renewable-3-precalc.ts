// Run inside workspace
// Precalculates overall stats used by habitat protection function

import fs from "fs";
import config, { ReportResultBase } from "../src/_config";
import { Metric } from "../src/metrics/types";
// @ts-ignore
import geoblaze from "geoblaze";
import { loadCogWindow } from "../src/datasources/cog";
import { strict as assert } from "assert";
import { createMetric, metricRekey } from "../src/metrics/metrics";

const DEST_PATH = `${__dirname}/precalc/renewableTotals.json`;
const LAYERS = config.renewable.classes;
const METRIC_ID = "renewable";

async function main() {
  const metrics: Metric[] = await Promise.all(
    LAYERS.map(async (curClass) => {
      const url = `${config.localDataUrl}${curClass.filename}`;
      const raster = await loadCogWindow(url, {
        noDataValue: curClass.noDataValue,
      }); // Load wole raster
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
  assert(Object.keys(result.metrics).length === LAYERS.length);
}

main();
