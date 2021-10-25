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
    layerId: "60ef55245bf512cb19da4d00",
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
    layerId: "60ef55245bf512cb19da4d08",
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
    layerId: "60ef55245bf512cb19da4d06",
  },
];

const totals = precalcTotals as Record<string, number>;

export const rasterConfig = rasterMaps.map((rasterMap) => {
  const filename = `${rasterMap.name}_cog.tif`;
  const url = `${dataBucketUrl}${filename}`;
  return { ...rasterMap, url, totalValue: totals[rasterMap.name] };
});
