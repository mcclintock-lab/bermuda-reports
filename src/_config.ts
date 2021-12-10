import {
  ClassMetrics,
  ClassMetricsSketch,
  GroupMetricsSketch,
  ValueMetric,
  SketchMetric,
  ClassMetric,
} from "../src/util/types";

/**
 * Area of ocean within eez minus land in square miles. Calculated by drawing
 * sketch in seasketch project, exporting the resulting sketch, calling turf/area function on it and converting square
 * meters to square miles */
export const STUDY_REGION_AREA_SQ_METERS = 465737168307.9038;
export const STUDY_REGION_AREA_SQ_KM = STUDY_REGION_AREA_SQ_METERS / 1000;
24031748;

export const units = "imperial";

export const localDataUrl = `http://127.0.0.1:8080/`;
export const dataBucketUrl =
  process.env.NODE_ENV === "test"
    ? localDataUrl
    : `https://gp-bermuda-reports-datasets.s3.us-east-1.amazonaws.com/`;

export const cogFileSuffix = "_cog.tif";
export const fgbFileSuffix = ".fgb";

//// OBJECTIVES ////

export const objectives = {
  eez: 0.2,
  habitatNursery: 0.5,
};

//// SIZE ////

//// EXISTING PROTECTIONS ////

export interface ExistingProtectionBaseResults {
  byClass: ClassMetrics;
}

export interface ExistingProtectionResults {
  byClass: ClassMetricsSketch;
}

// Single vector with multiple classes
// Individual map layers for viz
const existingProtectionBaseFilename = "existingProtections";
export const existingProtectionLayers = [
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

export const existingProtection = {
  baseFilename: existingProtectionBaseFilename,
  filename: `${existingProtectionBaseFilename}${fgbFileSuffix}`,
  layers: existingProtectionLayers,
  nameProperty: "Name",
  classProperty: "Type",
};

//// HABITAT ////

export interface HabitatResults {
  nearshore: ClassMetrics;
  offshore: ClassMetricsSketch;
}

// Categorical raster
const nearshoreBaseFilename = "Habitat Zones1";
const nearshoreLayers = [
  {
    class_id: "1",
    name: "Bays and Coast",
    goalPerc: 0.2,
  },
  {
    class_id: "2",
    name: "Madracis Reef",
    goalPerc: 0.2,
  },
  {
    class_id: "3",
    name: "Montastraea Reef",
    goalPerc: 0.2,
  },
  {
    class_id: "4",
    name: "Diploria Porites Reef",
    goalPerc: 0.2,
  },
  {
    class_id: "5",
    name: "Castle Harbour Madracis",
    goalPerc: 0.2,
  },
  {
    class_id: "6",
    name: "Algal Vermetid Reef",
    goalPerc: 0.2,
  },
  {
    class_id: "7",
    name: "Rim Reef",
    goalPerc: 0.2,
  },
  {
    class_id: "8",
    name: "Main Terrace Reef",
    goalPerc: 0.2,
  },
  {
    class_id: "9",
    name: "Fore Reef",
    goalPerc: 0.2,
  },
  {
    class_id: "10",
    name: "Mesophotic",
    goalPerc: 0.2,
  },
  {
    class_id: "11",
    name: "Rariphotic",
    goalPerc: 0.2,
  },
  {
    class_id: "12",
    name: "Mesopelagic",
    goalPerc: 0.2,
  },
  {
    class_id: "13",
    name: "Bathypelagic",
    goalPerc: 0.2,
  },
];

export const nearshore = {
  baseFilename: nearshoreBaseFilename,
  filename: `${nearshoreBaseFilename}${cogFileSuffix}`,
  layerId: "614df361c33508c127015a1c",
  layers: nearshoreLayers,
  classIdToName: nearshoreLayers.reduce<Record<string, string>>(
    (acc, lyr) => ({ ...acc, [lyr.class_id]: lyr.name }),
    {}
  ),
};

export const offshoreLayers = [
  {
    baseFilename: "feature_abyssopelagic",
    noDataValue: -3.39999995214436425e38,
    display: "Abyssopelagic",
    layerId: "61771f5ae9125f452fe759f8",
    goalPerc: 0.2,
  },
  {
    baseFilename: "Bathypelagic1",
    noDataValue: -3.39999995214436425e38,
    display: "Bathypelagic",
    layerId: "614df361c33508c1270159f2",
    goalPerc: 0.2,
  },
  {
    baseFilename: "Cold water coral1",
    noDataValue: -3.39999995214436425e38,
    display: "Cold water coral",
    layerId: "614df361c33508c1270159f4",
    goalPerc: 1,
  },
  {
    baseFilename: "Escarpments1",
    noDataValue: -3.39999995214436425e38,
    display: "Escarpments",
    layerId: "614df361c33508c1270159f6",
    goalPerc: 0.2,
  },
  {
    baseFilename: "Knolls1",
    noDataValue: -3.39999995214436425e38,
    display: "Knolls",
    layerId: "614df361c33508c1270159f8",
    goalPerc: 0.2,
  },
  {
    baseFilename: "Pelagic zone 1",
    noDataValue: -3.39999995214436425e38,
    display: "Pelagic zone 1",
    layerId: "614df361c33508c1270159fc",
    goalPerc: 0.2,
  },
  {
    baseFilename: "Pelagic zone 2",
    noDataValue: -3.39999995214436425e38,
    display: "Pelagic zone 2",
    layerId: "614df361c33508c1270159fe",
    goalPerc: 0.2,
  },
  {
    baseFilename: "Pelagic zone 3",
    noDataValue: -3.39999995214436425e38,
    display: "Pelagic zone 3",
    layerId: "614df361c33508c127015a00",
    goalPerc: 0.2,
  },
  {
    baseFilename: "Plains",
    noDataValue: -3.39999995214436425e38,
    display: "Plains",
    layerId: "614df361c33508c127015a02a",
    goalPerc: 0.1,
  },
  {
    baseFilename: "seamounts_buffered",
    noDataValue: -3.39999995214436425e38,
    display: "Seamounts",
    layerId: "61771fcde9125f452fe75b01",
    goalPerc: 0.4,
  },
];

export const offshore = {
  layers: offshoreLayers.map((lyr) => {
    return { ...lyr, filename: `${lyr.baseFilename}${cogFileSuffix}` };
  }),
};

//// REEF INDEX ////

export interface ReefIndexResults {
  reefIndex: ClassMetricsSketch;
}

export const reefIndexLayers = [
  {
    baseFilename: "wgs84_Coral cover1",
    noDataValue: -3.39999995214436425e38,
    display: "Coral Cover",
    layerId: "614df361c33508c127015a20",
    goalPerc: 0.2,
  },
  {
    baseFilename: "wgs84_Coral diversity (richness)1",
    noDataValue: -3.39999995214436425e38,
    display: "Coral Diversity (richness)",
    layerId: "614df361c33508c127015a22",
    goalPerc: 0.2,
  },
  {
    baseFilename: "wgs84_Coral recruit density1",
    noDataValue: -3.39999995214436425e38,
    display: "Coral Recruit Density",
    layerId: "614df361c33508c127015a24",
    goalPerc: 0.2,
  },
  {
    baseFilename: "wgs84_Rugosity1",
    noDataValue: -3.39999995214436425e38,
    display: "Rugosity (complexity)",
    layerId: "614df361c33508c127015a26",
    goalPerc: 0.2,
  },
  {
    baseFilename: "wgs84_Fish diversity (BRUVs data)1",
    noDataValue: -3.39999995214436425e38,
    display: "Fish Diversity (BRUV)",
    layerId: "614df361c33508c127015a14",
    goalPerc: 0.2,
  },
  {
    baseFilename: "wgs84_Fish density1",
    noDataValue: -3.39999995214436425e38,
    display: "Fish Density",
    layerId: "614df361c33508c127015a18",
    goalPerc: 0.2,
  },
  {
    baseFilename: "wgs84_Fish diversity (BREAM data)1",
    noDataValue: -3.39999995214436425e38,
    display: "Fish Diversity (BREAM)",
    layerId: "614df361c33508c127015a16",
    goalPerc: 0.2,
  },
  {
    baseFilename: "wgs84_Fish recruit density1",
    noDataValue: -3.39999995214436425e38,
    display: "Fish Recruit Density",
    layerId: "614df361c33508c127015a1a",
    goalPerc: 0.2,
  },
  {
    baseFilename: "wgs84_Seagrass Index Value1",
    noDataValue: -3.39999995214436425e38,
    display: "Seagrass",
    layerId: "614df361c33508c127015a1e",
    goalPerc: 0.5,
  },
];

export const reefIndex = {
  layers: reefIndexLayers.map((lyr) => {
    return { ...lyr, filename: `${lyr.baseFilename}${cogFileSuffix}` };
  }),
};

//// RENEWABLE ENERGY ////

export interface RenewableBaseResults {
  renewable: ClassMetrics;
}

export interface RenewableResults {
  renewable: ClassMetricsSketch;
}

export const renewableLayers = [
  {
    baseFilename: "float_solar1",
    noDataValue: -3.39999995214436425e38,
    display: "Floating Solar",
    layerId: "6185c0f7cef7c17717464da5",
  },
  {
    baseFilename: "wind_fixed1",
    noDataValue: -3.39999995214436425e38,
    display: "Fixed Offshore Wind",
    layerId: "6185c0f7cef7c17717464da3",
  },
  {
    baseFilename: "wind_float1",
    noDataValue: -3.39999995214436425e38,
    display: "Floating Offshore Wind",
    layerId: "6185c0f7cef7c17717464da1",
  },
  {
    baseFilename: "wave_energy1",
    noDataValue: -3.39999995214436425e38,
    display: "Wave Energy",
    layerId: "6185c0f7cef7c17717464d9f",
  },
];

export const renewable = {
  layers: renewableLayers.map((lyr) => {
    return { ...lyr, filename: `${lyr.baseFilename}${cogFileSuffix}` };
  }),
};

//// HABITAT RESTORATION ////

// base for precalc
export interface HabitatRestoreBaseResults {
  byClass: ClassMetrics;
}

export interface HabitatRestoreResults extends HabitatRestoreBaseResults {
  byClass: ClassMetricsSketch;
}

const habitatRestoreLayers = [
  {
    baseFilename: "seagrass_restoration_500mbuff",
    display: "Seagrass",
    layerId: "6185c0f7cef7c17717464d9d",
  },
  {
    baseFilename: "mangrove_restoration_500mbuff",
    display: "Mangrove/Saltmarsh",
    layerId: "6185c0f7cef7c17717464d9b",
  },
];

export const habitatRestore = {
  layers: habitatRestoreLayers.map((lyr) => {
    return { ...lyr, filename: `${lyr.baseFilename}${fgbFileSuffix}` };
  }),
};

//// KEY NURSERY HABITAT ////

// base for precalc
export interface HabitatNurseryResults {
  byClass: ClassMetrics;
  overall: ValueMetric;
}

export interface HabitatNurseryLevelResults extends HabitatNurseryResults {
  byClass: ClassMetricsSketch;
  byLevel: GroupMetricsSketch;
}

const habitatNurseryLayers = [
  {
    baseFilename: "PatchReef_JoannaEdit",
    display: "Nursery Reef",
    layerId: "619420a12633975e13933fe0",
  },
  {
    baseFilename: "Mangrove_shp_2012",
    display: "Mangrove",
    layerId: "5dc07170cae3e4074e65170b",
  },
  {
    baseFilename: "Seagrass_2014_50mbuff",
    display: "Seagrass",
    layerId: "5dc07170cae3e4074e651711",
  },
];

export const habitatNursery = {
  layers: habitatNurseryLayers.map((lyr) => {
    return { ...lyr, filename: `${lyr.baseFilename}${fgbFileSuffix}` };
  }),
};

//// OCEAN USE ////

export interface OceanUseResults {
  byClass: ClassMetricsSketch;
}

const oceanUseLayers = [
  {
    baseFilename: "aquaculture_heatmap",
    display: "Aquaculture",
    layerId: "60ef55245bf512cb19da4d04",
  },
  {
    baseFilename: "boating_heatmap",
    display: "Boating",
    layerId: "60ef55245bf512cb19da4d0a",
  },
  {
    baseFilename: "commercial_fishing_heatmap",
    display: "Commercial Fishing",
    layerId: "61648ab8a04323106537d190",
  },
  {
    baseFilename: "passiverec_conservation_heatmap",
    display: "Passive Recreation / Conservation",
    layerId: "60ef55245bf512cb19da4d10",
  },
  {
    baseFilename: "recreational_fishing_heatmap",
    display: "Recreational Fishing",
    layerId: "60ef55245bf512cb19da4d02",
  },
  {
    baseFilename: "shipping_heatmap",
    display: "Shipping",
    layerId: "61648ab8a04323106537d198",
  },
  {
    baseFilename: "swim_snorkel_dive_heatmap",
    display: "Swimming / Snorkeling / Diving",
    layerId: "60ef55245bf512cb19da4d0e",
  },
  {
    baseFilename: "tourism_heatmap",
    display: "Tourism",
    layerId: "60ef55245bf512cb19da4d0c",
  },
  {
    baseFilename: "utilities_heatmap",
    display: "Utilities",
    layerId: "61648ab8a04323106537d196",
  },
];

export const oceanUse = {
  layers: oceanUseLayers.map((lyr) => {
    return { ...lyr, filename: `${lyr.baseFilename}${cogFileSuffix}` };
  }),
};

//// PLATFORM EDGE ////

// Build up new type with additional property
export interface EdgeSketchMetric extends SketchMetric {
  overlap: boolean;
  numFishingRestricted: number;
}
export type EdgeClassMetricSketch = ClassMetric & {
  sketchMetrics: EdgeSketchMetric[];
};
export interface EdgeClassMetricsSketch {
  [name: string]: EdgeClassMetricSketch;
}
export interface EdgeGroupMetricsSketch {
  [name: string]: EdgeClassMetricsSketch;
}

// base for precalc
export interface PlatformEdgeBaseResult {
  byClass: ClassMetrics;
}

export interface PlatformEdgeResult extends PlatformEdgeBaseResult {
  byClass: EdgeClassMetricsSketch;
  byGroup: EdgeGroupMetricsSketch;
}

const platformEdgeLayers = [
  {
    baseFilename: "Pelagic_Fishing_Zone_Dissolved",
    display: "Platform Edge",
    layerId: "6164aebea04323106537eb5c",
    totalArea: 1734231963.998059,
  },
];

const fishingActivities = [
  // "TRAD_FISH_COLLECT", // not counted
  "FISH_COLLECT_REC",
  "FISH_COLLECT_LOCAL",
  "FISH_AQUA_INDUSTRIAL",
];

/**
 * Map break name to minimum number of restricted fishing activities required for membership
 */
const breakMap: Record<string, number> = {
  definite: fishingActivities.length,
  partial: 1,
  no: 0,
};

export const platformEdge = {
  layers: platformEdgeLayers.map((lyr) => {
    return { ...lyr, filename: `${lyr.baseFilename}${fgbFileSuffix}` };
  }),
  fishingActivities,
  breakMap,
};

//// Export ////

export default {
  STUDY_REGION_AREA_SQ_KM,
  STUDY_REGION_AREA_SQ_METERS,
  units,
  localDataUrl,
  dataBucketUrl,
  objectives,
  existingProtection,
  nearshore,
  offshore,
  reefIndex,
  renewable,
  oceanUse,
  habitatRestore,
  habitatNursery,
  platformEdge,
};
