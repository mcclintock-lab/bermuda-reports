// Run inside workspace
// Precalculates overall stats used by habitat protection function

import fs from "fs";
import config, { RenewableBaseResult } from "../src/_config";
import { ExtendedMetric } from "../src/metrics/types";
// @ts-ignore
import geoblaze from "geoblaze";
import { loadCogWindow } from "../src/datasources/cog";
import { strict as assert } from "assert";

const DEST_PATH = `${__dirname}/precalc/renewableTotals.json`;
const LAYERS = config.renewable.classes;
const REPORT_ID = "renewable";
const METRIC_ID = "renewable";

async function main() {
  const metrics: ExtendedMetric[] = await Promise.all(
    LAYERS.map(async (curClass) => {
      const url = `${config.localDataUrl}${curClass.filename}`;
      const raster = await loadCogWindow(url, {
        noDataValue: curClass.noDataValue,
      }); // Load wole raster
      const sum = geoblaze.sum(raster)[0] as number;
      return {
        reportId: REPORT_ID,
        classId: curClass.classId,
        metricId: METRIC_ID,
        value: sum,
      };
    })
  );

  const result: RenewableBaseResult = {
    metrics,
  };

  fs.writeFile(DEST_PATH, JSON.stringify(result, null, 2), (err) =>
    err
      ? console.error("Error", err)
      : console.info(`Successfully wrote ${DEST_PATH}`)
  );
  assert(Object.keys(result.metrics).length === LAYERS.length);
}

main();
