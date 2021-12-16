// Run inside workspace
// Precalculates overall stats

import fs from "fs";
import config from "../src/_config";
import { strict as assert } from "assert";
import area from "@turf/area";
import { featureCollection } from "@turf/helpers";

const CLASSES = config.existingProtection.classes;
const DATASET = `existingProtections`;
const DEST_PATH = `${__dirname}/precalc/${DATASET}Totals.json`;

const allFc = JSON.parse(
  fs.readFileSync(`${__dirname}/dist/${DATASET}.json`).toString()
);

async function main() {
  const totals = await Promise.all(
    CLASSES.map(async (curClass) => {
      // Filter out single class, exclude null geometry too
      const classFeatures = allFc.features.filter(
        (feat: any) =>
          feat.geometry &&
          feat.properties[config.existingProtection.classProperty] ===
            curClass.name,
        []
      );
      const classFC = featureCollection(classFeatures);
      return area(classFC);
    })
  );

  const totalArea = totals.reduce((sumSoFar, total) => sumSoFar + total, 0);

  const result = {
    byClass: CLASSES.reduce(
      (soFar, curClass, index) => ({
        ...soFar,
        [curClass.name]: {
          name: curClass.name,
          value: totals[index],
          percValue: totals[index] / totalArea,
        },
      }),
      {}
    ),
  };

  fs.writeFile(DEST_PATH, JSON.stringify(result, null, 2), (err) =>
    err
      ? console.error("Error", err)
      : console.info(`Successfully wrote ${DEST_PATH}`)
  );
  assert(Object.keys(result.byClass).length === CLASSES.length);
}

main();
