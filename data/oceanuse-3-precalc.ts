// Run inside workspace
// Precalculates overall stats used by habitat function

import fs from "fs";
import config from "../src/_config";
// @ts-ignore
import geoblaze from "geoblaze";
// @ts-ignore

// TODO: fix, uses local cog because get esmodule error due to fgb when importing from geoprocessing
// @ts-ignore
import { loadCogWindow } from "../src/datasources/cog";
import { strict as assert } from "assert";

const CLASSES = config.oceanUse.classes;
const DATASET = "oceanUse";

async function main() {
  const DEST_PATH = `${__dirname}/precalc/${DATASET}Totals.json`;
  const totals = await Promise.all(
    CLASSES.map(async (curClass) => {
      const url = `${config.localDataUrl}${curClass.filename}`;
      const raster = await loadCogWindow(url, {});
      const sum = geoblaze.sum(raster)[0] as number;
      return sum;
    })
  );

  const totalMap = totals.reduce(
    (totalMap, total, index) => ({
      ...totalMap,
      [CLASSES[index].classId]: total,
    }),
    {}
  );

  fs.writeFile(DEST_PATH, JSON.stringify(totalMap, null, 2), (err) =>
    err
      ? console.error("Error", err)
      : console.info(`Successfully wrote ${DEST_PATH}`)
  );
  assert(Object.keys(totalMap).length === CLASSES.length);
}

main();
