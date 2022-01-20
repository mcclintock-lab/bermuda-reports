// Run inside workspace
// Precalculates overall stats used by habitat function

import fs from "fs";
import config from "../src/_config";
// @ts-ignore
import geoblaze from "geoblaze";
// @ts-ignore

// TODO: fix, uses local cog because get esmodule error due to fgb when importing from geoprocessing
// @ts-ignore
import { loadCogWindow } from "../src/datasources/cog";
import { Metric } from "../src/metrics/types";
import { ReportResultBase } from "../src/_config";
import { createMetric, metricRekey } from "../src/metrics/metrics";

const CLASSES = config.oceanUse.classes;
const DATASET = "oceanUse";
const METRIC_ID = "valueOverlap";

async function main() {
  const DEST_PATH = `${__dirname}/precalc/${DATASET}Totals.json`;
  const metrics: Metric[] = await Promise.all(
    CLASSES.map(async (curClass) => {
      const url = `${config.localDataUrl}${curClass.filename}`;
      const raster = await loadCogWindow(url, {});
      const value = geoblaze.sum(raster)[0] as number;
      return createMetric({
        classId: curClass.classId,
        metricId: METRIC_ID,
        value,
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
