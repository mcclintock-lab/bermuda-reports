// Run inside workspace
// Precalculates overall stats used by habitat function

import fs from "fs";
import config from "../src/_config";

import area from "@turf/area";
import { Metric } from "../src/metrics/types";
import { ReportResultBase } from "../src/_config";
import { createMetric, metricRekey } from "../src/metrics/metrics";

const CLASSES = config.habitatNursery.classes;
const DATASET = "habitatNursery";
const DEST_PATH = `${__dirname}/precalc/${DATASET}Totals.json`;
const METRIC_ID = "areaOverlap";

async function main() {
  const metrics: Metric[] = await Promise.all(
    CLASSES.map(async (curClass) => {
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

  const sumArea = metrics.reduce(
    (sumSoFar, metric) => sumSoFar + metric.value,
    0
  );

  // Aggregrate metric across all classes
  metrics.push(
    createMetric({
      metricId: METRIC_ID,
      value: sumArea,
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
