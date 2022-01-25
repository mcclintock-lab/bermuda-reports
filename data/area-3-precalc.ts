// Run inside workspace

import fs from "fs";
import { Metric } from "../src/metrics/types";
import { ReportResultBase, STUDY_REGION_AREA_SQ_METERS } from "../src/_config";
import { createMetric, rekeyMetrics } from "../src/metrics/helpers";

const DATASET = `area`;
const DEST_PATH = `${__dirname}/precalc/${DATASET}Totals.json`;
const METRIC_ID = "areaOverlap";

const NEARSHORE_AREA_SQ_METERS = 2587739629.079098;
const OFFSHORE_AREA_SQ_METERS =
  STUDY_REGION_AREA_SQ_METERS - NEARSHORE_AREA_SQ_METERS;

async function main() {
  const metrics: Metric[] = [
    createMetric({
      metricId: METRIC_ID,
      classId: "eez",
      value: STUDY_REGION_AREA_SQ_METERS,
    }),
    createMetric({
      metricId: METRIC_ID,
      classId: "nearshore",
      value: NEARSHORE_AREA_SQ_METERS,
    }),
    createMetric({
      metricId: METRIC_ID,
      classId: "offshore",
      value: OFFSHORE_AREA_SQ_METERS,
    }),
  ];

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
