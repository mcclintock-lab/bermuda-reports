import precalcTotals from "../../data/precalc/oceanUseTotals.json";

const rasterNames = [
  "Aquaculture_Area",
  "Boating_Area",
  "Commercial_Fishing_Area_all",
  "Passive_Recreation_Conservation",
  "Recreational",
  "Shipping",
  "Swimming_Snorkeling_Diving",
  "Tourism",
  "Utilities",
];

const totals = precalcTotals as Record<string, number>;

export const rasterConfig = rasterNames.map((name) => {
  const foo = totals[name] as any;
  const filename = `${name}_cog.tif`;
  const url = `http://127.0.0.1:8080/${filename}`;
  return { name, url, totalValue: totals[name] };
});
