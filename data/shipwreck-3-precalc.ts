// Run inside workspace

import fs from "fs";
import config from "../src/_config";
import { FeatureCollection, Polygon } from "@turf/helpers";
import { ReportResultBase } from "../src/_config";

const DATASET = `WreckHeatmap`;
const DEST_PATH = `${__dirname}/precalc/${DATASET}Totals.json`;

const CONFIG = config;
const REPORT = CONFIG.shipwreck;
const METRIC = REPORT.metrics.sumOverlap;
const CLASS = METRIC.classes[0];
if (!CONFIG || !REPORT || !METRIC || !CLASS)
  throw new Error("Problem accessing report config");

const allFc = JSON.parse(
  fs.readFileSync(`${__dirname}/dist/${DATASET}.json`).toString()
) as FeatureCollection<Polygon>;

async function main() {
  const sumWrecks = allFc.features.reduce(
    (sumSoFar: number, feat) => sumSoFar + feat!.properties!.NumberOfRe,
    0
  );

  const result: ReportResultBase = {
    metrics: [
      {
        reportId: REPORT.reportId,
        classId: CLASS.classId,
        metricId: METRIC.metricId,
        value: sumWrecks,
      },
    ],
  };

  fs.writeFile(DEST_PATH, JSON.stringify(result, null, 2), (err) =>
    err
      ? console.error("Error", err)
      : console.info(`Successfully wrote ${DEST_PATH}`)
  );
}

main();
