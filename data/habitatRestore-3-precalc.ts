// Run inside workspace
// Precalculates overall stats used by habitat function

import fs from "fs";
import config from "../src/_config";

import { strict as assert } from "assert";
import area from "@turf/area";

const CLASSES = config.habitatRestore.layers;
const DATASET = "habitatRestore";

async function main() {
  const DEST_PATH = `${__dirname}/precalc/${DATASET}Totals.json`;
  const totals = await Promise.all(
    CLASSES.map(async (lyr) => {
      const fc = JSON.parse(
        fs.readFileSync(`${__dirname}/dist/${lyr.baseFilename}`).toString()
      );
      return area(fc);
    })
  );

  const totalArea = totals.reduce((sumSoFar, total) => sumSoFar + total, 0);

  const result = {
    overall: {
      value: totalArea,
      percValue: 1,
    },
    byClass: CLASSES.reduce(
      (soFar, curClass, index) => ({
        ...soFar,
        [curClass.baseFilename]: {
          name: curClass.baseFilename,
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
