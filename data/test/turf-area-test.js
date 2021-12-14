const fs = require("fs");
const area = require("@turf/area").default;

// Land

let land = JSON.parse(fs.readFileSync("./land-wgs84.geojson"));
let area_land = area(land);

console.log("land");
console.log(area_land);
console.log("");

// EEZ

let eez_with_land = JSON.parse(fs.readFileSync("./eez-with-land.geojson"));
let area_eez_with_land = area(eez_with_land);

console.log("EEZ with land");
console.log(area_eez_with_land);
console.log("");

// EEZ no land

/**
 * Calculated from sketch/eez-no-land.json
 * This was a polygon drawin in seasketch, then extracted from POST
 * Drop into examples/sketch
 * Edit clipToOceanEez.ts to not limit size
 * Edit clipToOceanEezSmoke.test.ts to load this sketch and calculate
 * Copy result to research/eez-no-land
 */

let eez_no_land = JSON.parse(fs.readFileSync("./eez-no-land.geojson"));
let area_eez_no_land = area(eez_no_land);

console.log("EEZ no land");
console.log(area_eez_no_land);
console.log("");

// Nearshore

let nearshore = JSON.parse(fs.readFileSync("./nearshore.geojson"));
let area_nearshore = area(nearshore);

console.log("nearshore");
console.log(area_nearshore);
console.log("");
