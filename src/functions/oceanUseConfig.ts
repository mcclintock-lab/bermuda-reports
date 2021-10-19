import precalcTotals from "../../data/precalc/oceanUseTotals.json";
import { dataBucketUrl } from "../_config";

const rasterMaps = [
  {
    name: "Aquaculture_Area",
    display: "Aquaculture",
    layerId: "60ef55245bf512cb19da4d04",
  },
  {
    name: "Boating_Area",
    display: "Boating",
    layerId: "60ef55245bf512cb19da4d0a",
  },
  {
    name: "Commercial_Fishing_Area_all",
    display: "Commercial Fishing",
    layerId: "60ef55245bf512cb19da4d00",
  },
  {
    name: "Passive_Recreation_Conservation",
    display: "Passive Recreation / Conservation",
    layerId: "60ef55245bf512cb19da4d10",
  },
  {
    name: "Recreational",
    display: "Recreational Fishing",
    layerId: "60ef55245bf512cb19da4d02",
  },
  {
    name: "Shipping",
    display: "Shipping",
    layerId: "60ef55245bf512cb19da4d08",
  },
  {
    name: "Swimming_Snorkeling_Diving",
    display: "Swimming / Snorkeling / Diving",
    layerId: "60ef55245bf512cb19da4d0e",
  },
  {
    name: "Tourism",
    display: "Tourism",
    layerId: "60ef55245bf512cb19da4d0c",
  },
  {
    name: "Utilities",
    display: "Utilities",
    layerId: "60ef55245bf512cb19da4d06",
  },
];

const totals = precalcTotals as Record<string, number>;

export const rasterConfig = rasterMaps.map((rasterMap) => {
  const foo = totals[rasterMap.name] as any;
  const filename = `${rasterMap.name}_cog.tif`;
  const url = `${dataBucketUrl}${filename}`;
  return { ...rasterMap, url, totalValue: totals[rasterMap.name] };
});
