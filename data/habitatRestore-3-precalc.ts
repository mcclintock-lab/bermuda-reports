// Run inside workspace
// Precalculates overall stats used by habitat function

import fs from "fs";
import config from "../src/_config";
import area from "@turf/area";
import { Metric } from "../src/metrics/types";
import { ReportResultBase } from "../src/_config";
import { createMetric, metricRekey } from "../src/metrics/metrics";

const CLASSES = config.habitatRestore.classes;
const DATASET = "habitatRestore";
const DEST_PATH = `${__dirname}/precalc/${DATASET}Totals.json`;
const METRIC_ID = "areaOverlap";

async function main() {
  const metrics: Metric[] = await Promise.all(
    CLASSES.map(async (curClass) => {
      // Filter out single class, exclude null geometry too
      const fc = JSON.parse(
        fs
          .readFileSync(`${__dirname}/dist/${curClass.baseFilename}.json`)
          .toString()
      );
      const value = area(fc);
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
