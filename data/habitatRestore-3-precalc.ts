// Run inside workspace
// Precalculates overall stats used by habitat function

import fs from "fs";
import config from "../src/_config";
import area from "@turf/area";
import { Metric } from "../src/metrics/types";
import { ReportResultBase } from "../src/_config";
import { createMetric, rekeyMetrics } from "../src/metrics/helpers";

const REPORT = config.habitatRestore;
const METRIC = REPORT.metrics.areaOverlap;
const DEST_PATH = `${__dirname}/precalc/${METRIC.datasourceId}Totals.json`;

async function main() {
  const metrics: Metric[] = await Promise.all(
    METRIC.classes.map(async (curClass) => {
      // Filter out single class, exclude null geometry too
      const fc = JSON.parse(
        fs
          .readFileSync(`${__dirname}/dist/${curClass.baseFilename}.json`)
          .toString()
      );
      const value = area(fc);
      return createMetric({
        classId: curClass.classId,
        metricId: METRIC.metricId,
        value,
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
