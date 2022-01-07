// Run inside workspace
// Precalculates overall stats used by habitat function

import fs from "fs";
import config from "../src/_config";

import { strict as assert } from "assert";
import area from "@turf/area";
import { ExtendedMetric } from "../src/metrics/types";

const CLASSES = config.habitatRestore.classes;
const DATASET = "habitatRestore";
const DEST_PATH = `${__dirname}/precalc/${DATASET}Totals.json`;
const REPORT_ID = "habitatRestore";
const METRIC_ID = "areaOverlap";

async function main() {
  const metrics: ExtendedMetric[] = await Promise.all(
    CLASSES.map(async (curClass) => {
      // Filter out single class, exclude null geometry too
      const fc = JSON.parse(
        fs
          .readFileSync(`${__dirname}/dist/${curClass.baseFilename}.json`)
          .toString()
      );
      const value = area(fc);
      return {
        reportId: REPORT_ID,
        classId: curClass.classId,
        metricId: METRIC_ID,
        value,
      };
    })
  );

  const result = {
    metrics,
  };

  fs.writeFile(DEST_PATH, JSON.stringify(result, null, 2), (err) =>
    err
      ? console.error("Error", err)
      : console.info(`Successfully wrote ${DEST_PATH}`)
  );
}

main();
