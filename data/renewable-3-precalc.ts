// Run inside workspace
// Precalculates overall stats used by habitat function

import fs from "fs";
import config from "../src/_config";
// @ts-ignore
import geoblaze from "geoblaze";
import { loadCogWindow } from "../src/datasources/cog";

import { strict as assert } from "assert";

const LAYERS = config.renewable.classes;
const DATASET = "renewable";

async function main() {
  const DEST_PATH = `${__dirname}/precalc/${DATASET}Totals.json`;
  const totals = await Promise.all(
    LAYERS.map(async (curClass) => {
      const url = `${config.localDataUrl}${curClass.filename}`;
      const raster = await loadCogWindow(url, {
        noDataValue: curClass.noDataValue,
      }); // Load wole raster
      const sum = geoblaze.sum(raster)[0] as number;
      return sum;
    })
  );

  const totalMap = totals.reduce(
    (totalMap, total, index) => ({
      ...totalMap,
      [LAYERS[index].name]: total,
    }),
    {}
  );

  fs.writeFile(DEST_PATH, JSON.stringify(totalMap, null, 2), (err) =>
    err
      ? console.error("Error", err)
      : console.info(`Successfully wrote ${DEST_PATH}`)
  );
  assert(Object.keys(totalMap).length === LAYERS.length);
}

main();
