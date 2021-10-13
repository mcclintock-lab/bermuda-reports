import {
  deserialize,
  fgBoundingBox,
  Feature,
  Polygon,
  BBox,
} from "@seasketch/geoprocessing";
import { takeAsync } from "flatgeobuf/lib/cjs/streams/utils";

export const fetchFromFgb = async (url: string, box: BBox) => {
  return (await takeAsync(
    deserialize(url, fgBoundingBox(box)) as AsyncGenerator
  )) as Feature<Polygon>[];
};
