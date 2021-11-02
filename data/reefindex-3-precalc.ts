// Run inside workspace
// Precalculates overall stats used by habitat function

import fs from "fs";
import config from "../src/_config";
// @ts-ignore
import geoblaze from "geoblaze";
// @ts-ignore

// TODO: fix, uses local cog because get esmodule error due to fgb when importing from geoprocessing
// @ts-ignore
import { loadCogWindow } from "../src/util/cog";
import { strict as assert } from "assert";

const LAYERS = config.reefIndex.layers;
const DATASET = "reefIndex";

async function main() {
  const DEST_PATH = `${__dirname}/precalc/${DATASET}Totals.json`;
  const totals = await Promise.all(
    LAYERS.map(async (lyr) => {
      const url = `${config.localDataUrl}${lyr.filename}`;
      const raster = await loadCogWindow(url, { noDataValue: lyr.noDataValue });
      const sum = geoblaze.sum(raster)[0] as number;
      return sum;
    })
  );

  const totalMap = totals.reduce(
    (totalMap, total, index) => ({
      ...totalMap,
      [LAYERS[index].baseFilename]: total,
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
