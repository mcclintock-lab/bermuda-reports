/**
 * Passthru to polygon-clipping methods
 */

import polygonClipping from "polygon-clipping";
import {
  Feature,
  featureCollection,
  multiPolygon,
  MultiPolygon,
  polygon,
  Polygon,
  Position,
  Properties,
} from "@turf/helpers";
import { geomEach } from "@turf/meta";

export function clip<P = Properties>(
  features: Feature<Polygon | MultiPolygon>[],
  operation: "union" | "intersection" | "xor" | "difference",
  options: {
    properties?: P;
  } = {}
): Feature<Polygon | MultiPolygon> | null {
  const coords: (Position[][] | Position[][][])[] = [];
  geomEach(featureCollection(features), (geom) => {
    coords.push(geom.coordinates);
  });
  //@ts-ignore
  const clipped = polygonClipping[operation](coords[0], ...coords.slice(1));

  if (clipped.length === 0) return null;
  if (clipped.length === 1) return polygon(clipped[0], options.properties);
  return multiPolygon(clipped, options.properties);
}
