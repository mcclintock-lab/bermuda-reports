// Run inside workspace
// Precalculates overall stats used by priority model function

import fs from "fs";
import config from "../src/_config";
import {
  Metric,
  ReportResultBase,
  createMetric,
  rekeyMetrics,
} from "@seasketch/geoprocessing";
import area from "@turf/area";

const REPORT = config.priorityModel;
const METRIC = REPORT.metrics.priorityModelAreaOverlap;
const DEST_PATH = `${__dirname}/precalc/${METRIC.datasourceId}Totals.json`;

async function main() {
  const metrics: Metric[] = await Promise.all(
    METRIC.classes.map(async (curClass) => {
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
