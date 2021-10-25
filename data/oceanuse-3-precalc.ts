// Run inside workspace
// Precalculates overall stats used by habitat function

import fs from "fs";
import { rasterConfig } from "../src/functions/oceanUseConfig";
// @ts-ignore
import geoblaze, { Georaster } from "geoblaze";
// @ts-ignore

// TODO: fix, uses local cog because get esmodule error due to fgb when importing from geoprocessing
// @ts-ignore
import { loadCogWindow } from "../src/util/cog";
import { strict as assert } from "assert";

const DEST_PATH = `${__dirname}/precalc/oceanUseTotals.json`;

async function main() {
  const sapTotals = await Promise.all(
    rasterConfig.map(async (mapConfig) => {
      const raster = await loadCogWindow(mapConfig.url, {});
      const sum = geoblaze.sum(raster)[0] as number;
      return sum;
    })
  );

  console.log("sapTotals", sapTotals);
  const sapMap = sapTotals.reduce(
    (sapMap, total, index) => ({
      ...sapMap,
      [rasterConfig[index].name]: total,
    }),
    {}
  );

  fs.writeFile(DEST_PATH, JSON.stringify(sapMap, null, 2), (err) =>
    err
      ? console.error("Error", err)
      : console.info(`Successfully wrote ${DEST_PATH}`)
  );

  assert(Object.keys(sapMap).length === rasterConfig.length);
  // assert(stats.areaByClass.length > 0);
  // const sumPerc = stats.areaByClass.reduce<number>(
  //   (sum, areaType) => areaType.percArea + sum,
  //   0
  // );
  // assert(sumPerc > 0.99 && sumPerc < 1.01);
}

main();
