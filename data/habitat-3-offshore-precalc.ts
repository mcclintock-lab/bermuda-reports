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

async function main() {
  //Offshore
  const DEST_PATH = `${__dirname}/precalc/offshoreHabitatTotals.json`;
  const totals = await Promise.all(
    config.offshore.classes.map(async (lyr) => {
      const url = `${config.localDataUrl}${lyr.filename}`;
      const raster = await loadCogWindow(url, { noDataValue: lyr.noDataValue });
      const sum = geoblaze.sum(raster)[0] as number;
      return sum;
    })
  );

  console.log("Offshore totals", totals);
  const totalMap = totals.reduce(
    (totalMap, total, index) => ({
      ...totalMap,
      [config.offshore.classes[index].name]: total,
    }),
    {}
  );

  fs.writeFile(DEST_PATH, JSON.stringify(totalMap, null, 2), (err) =>
    err
      ? console.error("Error", err)
      : console.info(`Successfully wrote ${DEST_PATH}`)
  );
  assert(Object.keys(totalMap).length === config.offshore.classes.length);
}

main();
