import {
  AreaByClassMetricResult,
  AreaByClassMetric,
  Feature,
  Polygon,
} from "@seasketch/geoprocessing/client";
import config from "../_config";

export const filename = "legislated.fgb";
export const nameProperty = "Name";
export const classProperty = "Type";
export type OverlapFeature = Feature<
  Polygon,
  { [nameProperty]: string; [classProperty]: string }
>;

export interface OverlapResult extends AreaByClassMetricResult {}
export interface OverlapMetric extends AreaByClassMetric {}

export const legislatedLayers = [
  {
    name: "Ferry Route",
    display: "Ferry Routes",
    layerId: "5dc07170cae3e4074e651716",
  },
  {
    name: "Shipping Lane",
    display: "Shipping Lanes",
    layerId: "5dc07170cae3e4074e65172e",
  },
  {
    name: "CableZone",
    display: "Cable Zones",
    layerId: "5e6acf64bef390124c2b4952",
  },
  {
    name: "SpearfishEx",
    display: "Spearfish Exclusion Zones",
    layerId: "615b214142b883e66c1a6cb3",
  },
  {
    name: "SeasonalPA",
    display: "Seasonally Protected Areas",
    layerId: "615b207f42b883e66c1a6c0d",
  },
  {
    name: "MPAExtendedClosure",
    display: "MPA Extended Closures",
    layerId: "61538b8cd5974aea32a4a5e6",
  },
  {
    name: "Wreck",
    display: "Wrecks",
    layerId: "5dc07170cae3e4074e651722",
  },
  {
    name: "Reef",
    display: "Protected Dive Sites",
    layerId: "615b204f42b883e66c1a6bf3",
  },
  {
    name: "Prohibited",
    display: "Prohibited Marine Board Notice Areas",
    layerId: "61538b8cd5974aea32a4a5e8",
  },
  {
    name: "NoNetFish",
    display: "No Net Fishing Areas",
    layerId: "615b211242b883e66c1a6c99",
  },
  {
    name: "NoLobsterFish",
    display: "No Lobster Fishing Areas",
    layerId: "615b216242b883e66c1a6ccb",
  },
  {
    name: "Amenity Park",
    display: "Amenity Parks",
    layerId: "615b209a42b883e66c1a6c20",
  },
  {
    name: "Recreational Park",
    display: "Recreational Parks",
    layerId: "615b209a42b883e66c1a6c20",
  },
  {
    name: "Nature Reserve",
    display: "Nature Reserves",
    layerId: "615b209a42b883e66c1a6c20",
  },
  {
    name: "CoralPreserve",
    display: "Coral Preserves",
    layerId: "615b202642b883e66c1a6b8b",
  },
];

export default {
  ...config,
  filename,
  nameProperty,
  classProperty,
  legislatedLayers,
};
