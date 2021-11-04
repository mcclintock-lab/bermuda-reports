import { ClassMetrics } from "../src/util/types";

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

//// SIZE ////

export const eezObjective = 0.2; // 20 percent

//// HABITAT ////

export interface HabitatResults {
  nearshore: ClassMetrics;
  offshore: ClassMetrics;
}

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
    name: "Mesotrophic",
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
  layerId: "60359da253bd7d85675a1bd8",
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
  reefIndex: ClassMetrics;
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

export interface RenewableResults {
  renewable: ClassMetrics;
}

export const renewableLayers = [
  {
    baseFilename: "float_solar1",
    noDataValue: -3.39999995214436425e38,
    display: "Floating Solar",
    layerId: "",
  },
  {
    baseFilename: "wind_fixed1",
    noDataValue: -3.39999995214436425e38,
    display: "Fixed Offshore Wind",
    layerId: "",
  },
  {
    baseFilename: "wind_float1",
    noDataValue: -3.39999995214436425e38,
    display: "Floating Offshore Wind",
    layerId: "",
  },
  {
    baseFilename: "wave_energy1",
    noDataValue: -3.39999995214436425e38,
    display: "Wave Energy",
    layerId: "",
  },
];

export const renewable = {
  layers: renewableLayers.map((lyr) => {
    return { ...lyr, filename: `${lyr.baseFilename}${cogFileSuffix}` };
  }),
};

//// HABITAT RESTORATION ////

export interface HabitatRestoreResults {
  /** area of the sketch in square meters */
  restore: ClassMetrics;
}

const habitatRestoreLayers = [
  {
    baseFilename: "seagrass_restoration",
    display: "Seagrass",
    type: "point",
    layerId: "",
  },
  {
    baseFilename: "mangrove_saltmarsh_restoration",
    display: "Mangrove/Saltmarsh",
    type: "linestring",
    layerId: "",
  },
];

export const habitatRestore = {
  layers: habitatRestoreLayers.map((lyr) => {
    return { ...lyr, filename: `${lyr.baseFilename}${fgbFileSuffix}` };
  }),
};

//// Export ////

export default {
  STUDY_REGION_AREA_SQ_KM,
  STUDY_REGION_AREA_SQ_METERS,
  units,
  localDataUrl,
  dataBucketUrl,
  eezObjective,
  nearshore,
  offshore,
  reefIndex,
  renewable,
  habitatRestore,
};
