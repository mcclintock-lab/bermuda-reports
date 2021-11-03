// Run inside workspace
// Precalculates overall stats used by habitat function

import fs from "fs";
import { rasterConfig } from "../src/functions/oceanUseConfig";
// @ts-ignore
import geoblaze, { Georaster } from "geoblaze";
import fetch from "node-fetch";
// @ts-ignore
import parseGeoraster from "georaster";

// TODO: fix, uses local cog because get esmodule error due to fgb when importing from geoprocessing
// @ts-ignore
import { loadCogWindow } from "../src/util/cog";
import { strict as assert } from "assert";

const DEST_PATH = `${__dirname}/precalc/oceanUseTotals.json`;

async function main() {
  const sapTotals = await Promise.all(
    rasterConfig.map(async (mapConfig) => {
      const response = await fetch(mapConfig.url);
      const rasterBuf = await response.arrayBuffer();
      const raster = await parseGeoraster(rasterBuf);
      const sum = geoblaze.sum(raster)[0] as number;
      console.log(mapConfig.name, sum);
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
}

main();
