import { DataGroup, DataClass, Report, Metric } from "../src/metrics/types";

import { NullSketch, NullSketchCollection } from "@seasketch/geoprocessing";

/**
 * Area of ocean within eez minus land in square miles. Calculated by drawing
 * sketch in seasketch project, exporting the resulting sketch, calling turf/area function on it and converting square
 * meters to square miles */
export const STUDY_REGION_AREA_SQ_METERS = 465737168307.9038;

export const units = "imperial";

export const localDataUrl = `http://127.0.0.1:8080/`;
export const dataBucketUrl =
  process.env.NODE_ENV === "test"
    ? localDataUrl
    : `https://gp-bermuda-reports-datasets.s3.us-east-1.amazonaws.com/`;

export const cogFileSuffix = "_cog.tif";
export const fgbFileSuffix = ".fgb";

export interface ReportResultBase {
  metrics: Metric[];
}

export interface ReportResult {
  metrics: Metric[];
  /** The sketch used, without geometry */
  sketch: NullSketch | NullSketchCollection;
}

//// OBJECTIVES ////

export const objectives = {
  eez: 0.2,
  habitatNursery: 0.5,
};

//// AREA ////

const sizeReport: Report = {
  reportId: "area",
  metrics: {
    areaOverlap: {
      metricId: "areaOverlap",
      baseFilename: "nearshore_dissolved",
      filename: "nearshore_dissolved.fgb",
      classes: [
        {
          classId: "eez",
          display: "EEZ",
        },
        {
          classId: "nearshore",
          display: "Nearshore",
        },
        {
          classId: "offshore",
          display: "Offshore",
        },
      ],
      layerId: "6164aebea04323106537eb5a",
    },
  },
};

//// PROTECTION ////

const protectionReport: Report = {
  reportId: "protection",
  metrics: {
    areaOverlap: {
      metricId: "areaOverlap",
      classes: [
        {
          classId: "eez",
          display: "EEZ",
        },
      ],
    },
  },
};

//// EXISTING PROTECTIONS ////

// Single vector dataset with multiple classes
const existingProtectionReport: Report = {
  reportId: "existingProtections",
  metrics: {
    areaOverlap: {
      metricId: "areaOverlap",
      baseFilename: "existingProtections",
      filename: "existingProtections.fgb",
      classProperty: "Type",
      classes: [
        {
          classId: "Ferry Route",
          display: "Ferry Routes",
          layerId: "5dc07170cae3e4074e651716",
        },
        {
          classId: "Shipping Lane",
          display: "Shipping Lanes",
          layerId: "5dc07170cae3e4074e65172e",
        },
        {
          classId: "CableZone",
          display: "Cable Zones",
          layerId: "5e6acf64bef390124c2b4952",
        },
        {
          classId: "SpearfishEx",
          display: "Spearfish Exclusion Zones",
          layerId: "615b214142b883e66c1a6cb3",
        },
        {
          classId: "SeasonalPA",
          display: "Seasonally Protected Areas",
          layerId: "615b207f42b883e66c1a6c0d",
        },
        {
          classId: "MPAExtendedClosure",
          display: "MPA Extended Closures",
          layerId: "61538b8cd5974aea32a4a5e6",
        },
        {
          classId: "Wreck",
          display: "Wrecks",
          layerId: "5dc07170cae3e4074e651722",
        },
        {
          classId: "Reef",
          display: "Protected Dive Sites",
          layerId: "615b204f42b883e66c1a6bf3",
        },
        {
          classId: "Prohibited",
          display: "Prohibited Marine Board Notice Areas",
          layerId: "61538b8cd5974aea32a4a5e8",
        },
        {
          classId: "NoNetFish",
          display: "No Net Fishing Areas",
          layerId: "615b211242b883e66c1a6c99",
        },
        {
          classId: "NoLobsterFish",
          display: "No Lobster Fishing Areas",
          layerId: "615b216242b883e66c1a6ccb",
        },
        {
          classId: "Amenity Park",
          display: "Amenity Parks",
          layerId: "615b209a42b883e66c1a6c20",
        },
        {
          classId: "Recreational Park",
          display: "Recreational Parks",
          layerId: "615b209a42b883e66c1a6c20",
        },
        {
          classId: "Nature Reserve",
          display: "Nature Reserves",
          layerId: "615b209a42b883e66c1a6c20",
        },
        {
          classId: "CoralPreserve",
          display: "Coral Preserves",
          layerId: "615b202642b883e66c1a6b8b",
        },
      ],
    },
  },
};

//// HABITAT PROTECTION ////

// Single-class rasters
const offshoreClasses: DataClass[] = [
  {
    baseFilename: "feature_abyssopelagic",
    noDataValue: -3.39999995214436425e38,
    classId: "Abyssopelagic",
    display: "Abyssopelagic",
    layerId: "61771f5ae9125f452fe759f8",
    goalPerc: 0.2,
  },
  {
    baseFilename: "Bathypelagic1",
    noDataValue: -3.39999995214436425e38,
    classId: "Bathypelagic",
    display: "Bathypelagic",
    layerId: "614df361c33508c1270159f2",
    goalPerc: 0.2,
  },
  {
    baseFilename: "Cold water coral1",
    noDataValue: -3.39999995214436425e38,
    classId: "Cold water coral",
    display: "Cold water coral",
    layerId: "614df361c33508c1270159f4",
    goalPerc: 1,
  },
  {
    baseFilename: "Escarpments1",
    noDataValue: -3.39999995214436425e38,
    classId: "Escarpments",
    display: "Escarpments",
    layerId: "614df361c33508c1270159f6",
    goalPerc: 0.2,
  },
  {
    baseFilename: "Knolls1",
    noDataValue: -3.39999995214436425e38,
    classId: "Knolls",
    display: "Knolls",
    layerId: "614df361c33508c1270159f8",
    goalPerc: 0.2,
  },
  {
    baseFilename: "Pelagic zone 1",
    noDataValue: -3.39999995214436425e38,
    classId: "Pelagic zone 1",
    display: "Pelagic zone 1",
    layerId: "614df361c33508c1270159fc",
    goalPerc: 0.2,
  },
  {
    baseFilename: "Pelagic zone 2",
    noDataValue: -3.39999995214436425e38,
    classId: "Pelagic zone 2",
    display: "Pelagic zone 2",
    layerId: "614df361c33508c1270159fe",
    goalPerc: 0.2,
  },
  {
    baseFilename: "Pelagic zone 3",
    noDataValue: -3.39999995214436425e38,
    classId: "Pelagic zone 3",
    display: "Pelagic zone 3",
    layerId: "614df361c33508c127015a00",
    goalPerc: 0.2,
  },
  {
    baseFilename: "Plains",
    noDataValue: -3.39999995214436425e38,
    classId: "Plains",
    display: "Plains",
    layerId: "614df361c33508c127015a02a",
    goalPerc: 0.1,
  },
  {
    baseFilename: "seamounts_buffered",
    noDataValue: -3.39999995214436425e38,
    classId: "Seamounts",
    display: "Seamounts",
    layerId: "61771fcde9125f452fe75b01",
    goalPerc: 0.4,
  },
];

// Multi-class raster (categorical)
const nearshoreClasses: DataClass[] = [
  {
    numericClassId: 1,
    classId: "Bays and Coast",
    display: "Bays and Coast",
    goalPerc: 0.2,
  },
  {
    numericClassId: 2,
    classId: "Madracis Reef",
    display: "Madracis Reef",
    goalPerc: 0.2,
  },
  {
    numericClassId: 3,
    classId: "Montastraea Reef",
    display: "Montastraea Reef",
    goalPerc: 0.2,
  },
  {
    numericClassId: 4,
    classId: "Diploria Porites Reef",
    display: "Diploria Porites Reef",
    goalPerc: 0.2,
  },
  {
    numericClassId: 5,
    classId: "Castle Harbour Madracis",
    display: "Castle Harbour Madracis",
    goalPerc: 0.2,
  },
  {
    numericClassId: 6,
    classId: "Algal Vermetid Reef",
    display: "Algal Vermetid Reef",
    goalPerc: 0.2,
  },
  {
    numericClassId: 7,
    classId: "Rim Reef",
    display: "Rim Reef",
    goalPerc: 0.2,
  },
  {
    numericClassId: 8,
    classId: "Main Terrace Reef",
    display: "Main Terrace Reef",
    goalPerc: 0.2,
  },
  {
    numericClassId: 9,
    classId: "Fore Reef",
    display: "Fore Reef",
    goalPerc: 0.2,
  },
  {
    numericClassId: 10,
    classId: "Mesophotic",
    display: "Mesophotic",
    goalPerc: 0.2,
  },
  {
    numericClassId: 11,
    classId: "Rariphotic",
    display: "Rariphotic",
    goalPerc: 0.2,
  },
  {
    numericClassId: 12,
    classId: "Mesopelagic",
    display: "Mesopelagic",
    goalPerc: 0.2,
  },
  {
    numericClassId: 13,
    classId: "Bathypelagic",
    display: "Bathypelagic",
    goalPerc: 0.2,
  },
];

const habitatProtectionReport: Report = {
  reportId: "habitatProtection",
  metrics: {
    nearshoreAreaOverlap: {
      metricId: "nearshoreAreaOverlap",
      baseFilename: "Habitat Zones1",
      filename: `Habitat Zones1${cogFileSuffix}`,
      classes: nearshoreClasses,
      layerId: "614df361c33508c127015a1c",
    },
    offshoreAreaOverlap: {
      metricId: "offshoreAreaOverlap",
      classes: offshoreClasses.map((curClass) => {
        return {
          ...curClass,
          filename: `${curClass.baseFilename}${cogFileSuffix}`,
        };
      }),
    },
  },
};

export const nearshoreDataGroup: DataGroup = {
  datasourceId: "nearshore",
  baseFilename: "Habitat Zones1",
  filename: `Habitat Zones1${cogFileSuffix}`,
  classes: nearshoreClasses,
  layerId: "614df361c33508c127015a1c",
};

export const offshoreDataGroup: DataGroup = {
  datasourceId: "offshore",
  classes: offshoreClasses.map((curClass) => {
    return {
      ...curClass,
      filename: `${curClass.baseFilename}${cogFileSuffix}`,
    };
  }),
};

//// REEF INDEX ////

export const reefIndexClasses: DataClass[] = [
  {
    baseFilename: "wgs84_Coral cover1",
    noDataValue: -3.39999995214436425e38,
    classId: "Coral Cover",
    display: "Coral Cover",
    layerId: "614df361c33508c127015a20",
    goalPerc: 0.2,
  },
  {
    baseFilename: "wgs84_Coral diversity (richness)1",
    noDataValue: -3.39999995214436425e38,
    classId: "Coral Diversity",
    display: "Coral Diversity (richness)",
    layerId: "614df361c33508c127015a22",
    goalPerc: 0.2,
  },
  {
    baseFilename: "wgs84_Coral recruit density1",
    noDataValue: -3.39999995214436425e38,
    classId: "Coral Recruit Density",
    display: "Coral Recruit Density",
    layerId: "614df361c33508c127015a24",
    goalPerc: 0.2,
  },
  {
    baseFilename: "wgs84_Rugosity1",
    noDataValue: -3.39999995214436425e38,
    classId: "Rugosity",
    display: "Rugosity (complexity)",
    layerId: "614df361c33508c127015a26",
    goalPerc: 0.2,
  },
  {
    baseFilename: "wgs84_Fish diversity (BRUVs data)1",
    noDataValue: -3.39999995214436425e38,
    classId: "Fish Diversity BRUV",
    display: "Fish Diversity (BRUV)",
    layerId: "614df361c33508c127015a14",
    goalPerc: 0.2,
  },
  {
    baseFilename: "wgs84_Fish density1",
    noDataValue: -3.39999995214436425e38,
    classId: "Fish Density",
    display: "Fish Density",
    layerId: "614df361c33508c127015a18",
    goalPerc: 0.2,
  },
  {
    baseFilename: "wgs84_Fish diversity (BREAM data)1",
    noDataValue: -3.39999995214436425e38,
    classId: "Fish Diversity BREAM",
    display: "Fish Diversity (BREAM)",
    layerId: "614df361c33508c127015a16",
    goalPerc: 0.2,
  },
  {
    baseFilename: "wgs84_Fish recruit density1",
    noDataValue: -3.39999995214436425e38,
    classId: "Fish Recruit Density",
    display: "Fish Recruit Density",
    layerId: "614df361c33508c127015a1a",
    goalPerc: 0.2,
  },
  {
    baseFilename: "wgs84_Seagrass Index Value1",
    noDataValue: -3.39999995214436425e38,
    classId: "Seagrass",
    display: "Seagrass",
    layerId: "614df361c33508c127015a1e",
    goalPerc: 0.5,
  },
];

export const reefIndex: DataGroup = {
  datasourceId: "reefIndex",
  classes: reefIndexClasses.map((curClass) => {
    return {
      ...curClass,
      filename: `${curClass.baseFilename}${cogFileSuffix}`,
    };
  }),
};

//// RENEWABLE ENERGY ////

export const renewableClasses: DataClass[] = [
  {
    baseFilename: "wind_fixed1",
    noDataValue: -3.39999995214436425e38,
    classId: "Fixed Offshore Wind",
    display: "Fixed Offshore Wind",
    layerId: "6185c0f7cef7c17717464da3",
  },
  {
    baseFilename: "float_solar1",
    noDataValue: -3.39999995214436425e38,
    classId: "Floating Solar",
    display: "Floating Solar",
    layerId: "6185c0f7cef7c17717464da5",
  },
  {
    baseFilename: "wind_float1",
    noDataValue: -3.39999995214436425e38,
    classId: "Floating Offshore Wind",
    display: "Floating Offshore Wind",
    layerId: "6185c0f7cef7c17717464da1",
  },
  {
    baseFilename: "wave_energy1",
    noDataValue: -3.39999995214436425e38,
    classId: "Wave Energy",
    display: "Wave Energy",
    layerId: "6185c0f7cef7c17717464d9f",
  },
];

export const renewable: DataGroup = {
  classes: renewableClasses.map((curClass) => {
    return {
      ...curClass,
      filename: `${curClass.baseFilename}${cogFileSuffix}`,
    };
  }),
};

//// HABITAT RESTORATION ////

const habitatRestoreClasses: DataClass[] = [
  {
    baseFilename: "coral_restoration_areas",
    classId: "Coral",
    display: "Coral",
    layerId: "",
  },
  {
    baseFilename: "seagrass_restoration_500mbuff",
    classId: "Seagrass",
    display: "Seagrass",
    layerId: "6185c0f7cef7c17717464d9d",
  },
  {
    baseFilename: "mangrove_restoration_500mbuff",
    classId: "Mangrove_Saltmarsh",
    display: "Mangrove/Saltmarsh",
    layerId: "6185c0f7cef7c17717464d9b",
  },
];

export const habitatRestore: DataGroup = {
  classes: habitatRestoreClasses.map((curClass) => {
    return {
      ...curClass,
      filename: `${curClass.baseFilename}${fgbFileSuffix}`,
    };
  }),
};

//// KEY NURSERY HABITAT ////

const habitatNurseryClasses: DataClass[] = [
  {
    baseFilename: "PatchReef_JoannaEdit",
    classId: "Nursery Reef",
    display: "Nursery Reef",
    layerId: "619420a12633975e13933fe0",
  },
  {
    baseFilename: "Mangrove_shp_2012",
    classId: "Mangrove",
    display: "Mangrove",
    layerId: "5dc07170cae3e4074e65170b",
  },
  {
    baseFilename: "Seagrass_2014_50mbuff",
    classId: "Seagrass",
    display: "Seagrass",
    layerId: "5dc07170cae3e4074e651711",
  },
];

export const habitatNursery: DataGroup = {
  classes: habitatNurseryClasses.map((curClass) => {
    return {
      ...curClass,
      filename: `${curClass.baseFilename}${fgbFileSuffix}`,
    };
  }),
};

//// OCEAN USE ////

const oceanUseClasses: DataClass[] = [
  {
    baseFilename: "aquaculture_heatmap",
    classId: "Aquaculture",
    display: "Aquaculture",
    layerId: "60ef55245bf512cb19da4d04",
  },
  {
    baseFilename: "boating_heatmap",
    classId: "Boating",
    display: "Boating",
    layerId: "60ef55245bf512cb19da4d0a",
  },
  {
    baseFilename: "commercial_fishing_heatmap",
    classId: "CommercialFishing",
    display: "Commercial Fishing",
    layerId: "61648ab8a04323106537d190",
  },
  {
    baseFilename: "passiverec_conservation_heatmap",
    classId: "PassiveRecreation_Conservation",
    display: "Passive Recreation / Conservation",
    layerId: "60ef55245bf512cb19da4d10",
  },
  {
    baseFilename: "recreational_fishing_heatmap",
    classId: "Recreational Fishing",
    display: "Recreational Fishing",
    layerId: "60ef55245bf512cb19da4d02",
  },
  {
    baseFilename: "shipping_heatmap",
    classId: "Shipping",
    display: "Shipping",
    layerId: "61648ab8a04323106537d198",
  },
  {
    baseFilename: "swim_snorkel_dive_heatmap",
    classId: "Swimming_Snorkeling_Diving",
    display: "Swimming / Snorkeling / Diving",
    layerId: "60ef55245bf512cb19da4d0e",
  },
  {
    baseFilename: "tourism_heatmap",
    classId: "Tourism",
    display: "Tourism",
    layerId: "60ef55245bf512cb19da4d0c",
  },
  {
    baseFilename: "utilities_heatmap",
    classId: "Utilities",
    display: "Utilities",
    layerId: "61648ab8a04323106537d196",
  },
];

export const oceanUse: DataGroup = {
  classes: oceanUseClasses.map((curClass) => {
    return {
      ...curClass,
      filename: `${curClass.baseFilename}${cogFileSuffix}`,
    };
  }),
};

//// SHIPWRECKS ////

const shipwreckReport: Report = {
  reportId: "shipwreck",
  metrics: {
    valueOverlap: {
      metricId: "valueOverlap",
      baseFilename: "WreckHeatmap",
      filename: "WreckHeatmap.fgb",
      classes: [
        {
          classId: "shipwreck",
          display: "Shipwrecks",
        },
      ],
      layerId: "61538b8cd5974aea32a4a5ea",
    },
  },
};

//// PLATFORM EDGE ////

export type PlatformEdgeDataGroup = DataGroup & {
  fishingActivities: string[];
  breakMap: Record<string, number>;
};

export interface EdgeSketchMetric extends Metric {
  extra: {
    numFishingRestricted: number;
    overlapEdge: boolean;
  };
}

const platformEdgeClasses: DataClass[] = [
  {
    baseFilename: "Pelagic_Fishing_Zone_Dissolved",
    classId: "Platform Edge",
    display: "Platform Edge",
    layerId: "6164aebea04323106537eb5c",
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

export const platformEdge: PlatformEdgeDataGroup = {
  classes: platformEdgeClasses.map((curClass) => {
    return {
      ...curClass,
      filename: `${curClass.baseFilename}${fgbFileSuffix}`,
    };
  }),
  fishingActivities,
  breakMap,
};

//// Export ////

export default {
  STUDY_REGION_AREA_SQ_METERS,
  units,
  localDataUrl,
  dataBucketUrl,
  objectives,
  size: sizeReport,
  protection: protectionReport,
  existingProtection: existingProtectionReport,
  habitatProtection: habitatProtectionReport,
  reefIndex,
  renewable,
  oceanUse,
  habitatRestore,
  habitatNursery,
  platformEdge,
  shipwreck: shipwreckReport,

  reports: {
    speciesProtection: {
      reportId: "speciesProtection",
      metrics: ["nearshore", "offshore"],
    },
    habitatProtection: {
      reportId: "habitatProtection",
      metrics: ["nearshoreAreaOverlap", "offshoreAreaOverlap"],
    },
  },

  metrics: {
    reefIndexValueOverlap: {
      metricId: "reefIndexValueOverlap",
      datasources: ["reefIndex"],
    },
    nearshoreAreaOverlap: {
      metricId: "nearshoreAreaOverlap",
      datasources: ["nearshore"],
    },
    offshoreAreaOverlap: {
      metricId: "offshoreAreaOverlap",
      datasources: ["offshore"],
    },
  },

  dataGroups: {
    reefIndex,
    nearshoreDataGroup,
    offshoreDataGroup,
  },
};
