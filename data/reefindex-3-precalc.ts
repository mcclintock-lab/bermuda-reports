// Run inside workspace
// Precalculates overall stats used by habitat function

import fs from "fs";
import config from "../src/_config";
// @ts-ignore
import geoblaze from "geoblaze";
// @ts-ignore
import parseGeoraster from "georaster";
import fetch from "node-fetch";

const CONFIG = config.reefIndex;
const DATASET = "reefIndex";
const REPORT_ID = "reefIndex";
const METRIC_ID = "valueOverlap";

async function main() {
  const DEST_PATH = `${__dirname}/precalc/${DATASET}Totals.json`;
  const metrics = await Promise.all(
    CONFIG.classes.map(async (curClass) => {
      const url = `${config.localDataUrl}${curClass.filename}`;
      const response = await fetch(url);
      const rasterBuf = await response.arrayBuffer();
      const raster = await parseGeoraster(rasterBuf);
      const value = geoblaze.sum(raster)[0] as number;
      return {
        reportId: REPORT_ID,
        classId: curClass.classId,
        metricId: METRIC_ID,
        value,
      };
    })
  );

  const result = { metrics };

  fs.writeFile(DEST_PATH, JSON.stringify(result, null, 2), (err) =>
    err
      ? console.error("Error", err)
      : console.info(`Successfully wrote ${DEST_PATH}`)
  );
}

main();
