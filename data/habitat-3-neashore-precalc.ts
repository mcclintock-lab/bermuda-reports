import fs from "fs";
import config from "../src/_config";
// @ts-ignore
import { loadCogWindow } from "../src/datasources/cog";
// @ts-ignore
import geoblaze from "geoblaze";
import { Georaster } from "@seasketch/geoprocessing";

const DEST_PATH = `${__dirname}/precalc/nearshoreHabitatTotals.json`;
const CONFIG = config.nearshore;

async function main() {
  const url = `${config.localDataUrl}${CONFIG.filename}`;

  try {
    const raster = await loadCogWindow(url, {}); // Load wole raster
    const stats = await countByClass(raster, {
      classIdToName: CONFIG.classIdToName,
    });

    fs.writeFile(DEST_PATH, JSON.stringify(stats, null, 2), (err) =>
      err
        ? console.error("Error", err)
        : console.info(`Successfully wrote ${DEST_PATH}`)
    );
  } catch (err) {
    throw new Error(
      `raster fetch failed, did you start-data? Is this url correct? ${url}`
    );
  }
}

(async function () {
  await main();
})().catch(console.error);

/**
 * Implements the raster-based areaByClass calculation
 */
export async function countByClass(
  /** raster to search */
  raster: Georaster,
  config: { classIdToName: Record<string, string> }
): Promise<Record<string, number>> {
  if (!config.classIdToName)
    throw new Error("Missing classIdToName map in config");

  const histogram = geoblaze.histogram(raster, undefined, {
    scaleType: "nominal",
  })[0];

  const ids = Object.keys(config.classIdToName);
  // Initialize the total counts
  let countByClass = ids.reduce<Record<string, number>>(
    (acc, classId) => ({
      ...acc,
      [classId]: 0,
    }),
    {}
  );

  // Migrate the total counts, skip nodata
  Object.keys(histogram).forEach((classId) => {
    if (ids.includes(classId)) {
      countByClass[classId] += histogram[classId];
    }
  });

  return countByClass;
}
