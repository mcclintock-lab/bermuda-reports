import precalcTotals from "../../data/precalc/oceanUseTotals.json";
import { dataBucketUrl } from "../_config";

const rasterMaps = [
  {
    name: "aquaculture_heatmap",
    display: "Aquaculture",
    layerId: "60ef55245bf512cb19da4d04",
  },
  {
    name: "boating_heatmap",
    display: "Boating",
    layerId: "60ef55245bf512cb19da4d0a",
  },
  {
    name: "commercial_fishing_heatmap",
    display: "Commercial Fishing",
    layerId: "61648ab8a04323106537d190",
  },
  {
    name: "passiverec_conservation_heatmap",
    display: "Passive Recreation / Conservation",
    layerId: "60ef55245bf512cb19da4d10",
  },
  {
    name: "recreational_fishing_heatmap",
    display: "Recreational Fishing",
    layerId: "60ef55245bf512cb19da4d02",
  },
  {
    name: "shipping_heatmap",
    display: "Shipping",
    layerId: "61648ab8a04323106537d198",
  },
  {
    name: "swim_snorkel_dive_heatmap",
    display: "Swimming / Snorkeling / Diving",
    layerId: "60ef55245bf512cb19da4d0e",
  },
  {
    name: "tourism_heatmap",
    display: "Tourism",
    layerId: "60ef55245bf512cb19da4d0c",
  },
  {
    name: "utilities_heatmap",
    display: "Utilities",
    layerId: "61648ab8a04323106537d196",
  },
];

const totals = precalcTotals as Record<string, number>;

export const rasterConfig = rasterMaps.map((rasterMap) => {
  const filename = `${rasterMap.name}_cog.tif`;
  const url = `${dataBucketUrl}${filename}`;
  return { ...rasterMap, url, totalValue: totals[rasterMap.name] };
});
