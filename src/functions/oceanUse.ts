import {
  Sketch,
  SketchCollection,
  GeoprocessingHandler,
  Polygon,
} from "@seasketch/geoprocessing";
import { SapMetric, sapStats } from "../util/sapStats";
import { rasterConfig } from "./oceanUseConfig";

export interface SapMapResults {
  [map: string]: SapMetric;
}

export async function oceanUse(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>
): Promise<SapMapResults> {
  const results = await Promise.all(
    rasterConfig.map(
      async (config) =>
        await sapStats(config.name, config.url, sketch, config.totalValue)
    )
  );
  const resultMap = results.reduce(
    (resultMap, result) => ({ ...resultMap, [result.name]: result }),
    {}
  );
  return resultMap;
}

export default new GeoprocessingHandler(oceanUse, {
  title: "oceanUse",
  description: "ocean use survey stats",
  timeout: 30, // seconds
  executionMode: "async",
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
});
