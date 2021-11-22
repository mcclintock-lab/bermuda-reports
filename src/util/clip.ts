/**
 * Passthru to polygon-clipping methods
 */

import polygonClipping from "polygon-clipping";
import {
  Feature,
  multiPolygon,
  MultiPolygon,
  polygon,
  Polygon,
  Properties,
} from "@turf/helpers";
import { getGeom } from "@turf/invariant";

export function clip<P = Properties>(
  features: Feature<Polygon | MultiPolygon>[],
  operation: "union" | "intersection" | "xor" | "difference",
  options: {
    properties?: P;
  } = {}
): Feature<Polygon | MultiPolygon, any> | null {
  const coords = features.map((feat) => getGeom(feat).coordinates);
  //@ts-ignore
  const clipped = polygonClipping[operation](...coords);

  if (clipped.length === 0) return null;
  if (clipped.length === 1) return polygon(clipped[0], options.properties);
  return multiPolygon(clipped, options.properties);
}
