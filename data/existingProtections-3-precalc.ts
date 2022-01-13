// Run inside workspace

import fs from "fs";
import config from "../src/_config";
import { strict as assert } from "assert";
import area from "@turf/area";
import { featureCollection } from "@turf/helpers";
import { ReportMetric } from "../src/metrics/types";
import { ReportResultBase } from "../src/_config";

export const nameProperty = "Name";
export const classProperty = "Type";

const CLASSES = config.existingProtection.classes;
const DATASET = `existingProtections`;
const DEST_PATH = `${__dirname}/precalc/${DATASET}Totals.json`;
const REPORT_ID = "existingProtections";
const METRIC_ID = "areaOverlap";

const allFc = JSON.parse(
  fs.readFileSync(`${__dirname}/dist/${DATASET}.json`).toString()
);

async function main() {
  const metrics: ReportMetric[] = await Promise.all(
    CLASSES.map(async (curClass) => {
      // Filter out single class, exclude null geometry too
      const classFeatures = allFc.features.filter((feat: any) => {
        return (
          feat.geometry && feat.properties[classProperty] === curClass.classId
        );
      }, []);
      const classFC = featureCollection(classFeatures);
      const value = area(classFC);
      return {
        reportId: REPORT_ID,
        classId: curClass.classId,
        metricId: METRIC_ID,
        value,
      };
    })
  );

  const result: ReportResultBase = {
    metrics,
  };

  fs.writeFile(DEST_PATH, JSON.stringify(result, null, 2), (err) =>
    err
      ? console.error("Error", err)
      : console.info(`Successfully wrote ${DEST_PATH}`)
  );
}

main();
