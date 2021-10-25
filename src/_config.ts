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

export const eezObjective = 0.2; // 20 percent

/** Habitat */

export const fileSuffix = "_cog.tif";

const nearshoreBaseFilename = "Habitat Zones1";

export const nearshore: {
  baseFilename: string;
  filename: string;
  layerId: string;
  classIdToName: Record<string, string>;
} = {
  baseFilename: nearshoreBaseFilename,
  filename: `${nearshoreBaseFilename}${fileSuffix}`,
  layerId: "60359da253bd7d85675a1bd8",
  classIdToName: {
    "1": "Bays and Coast",
    "2": "Madracis Reef",
    "3": "Montastraea Reef",
    "4": "Diploria Porites Reef",
    "5": "Castle Harbour Madracis",
    "6": "Algal Vermetid Reef",
    "7": "Rim Reef",
    "8": "Main Terrace Reef",
    "9": "Fore Reef",
    "10": "Mesotrophic",
    "11": "Rariphotic",
    "12": "Mesopelagic",
    "13": "Bathypelagic",
  },
};

export const offshoreLayers = [
  {
    baseFilename: "feature_abyssopelagic",
    noDataValue: -3.39999995214436425e38,
    display: "Abyssopelagic",
    layerId: "",
  },
  {
    baseFilename: "Bathypelagic1",
    noDataValue: -3.39999995214436425e38,
    display: "Bathypelagic",
    layerId: "",
  },
  {
    baseFilename: "Cold water coral1",
    noDataValue: -3.39999995214436425e38,
    display: "Cold water coral",
    layerId: "",
  },
  {
    baseFilename: "Escarpments1",
    noDataValue: -3.39999995214436425e38,
    display: "Escarpments",
    layerId: "",
  },
  {
    baseFilename: "Knolls1",
    noDataValue: -3.39999995214436425e38,
    display: "Knolls",
    layerId: "",
  },
  {
    baseFilename: "Pelagic zone 1",
    noDataValue: -3.39999995214436425e38,
    display: "Pelagic zone 1",
    layerId: "",
  },
  {
    baseFilename: "Pelagic zone 2",
    noDataValue: -3.39999995214436425e38,
    display: "Pelagic zone 2",
    layerId: "",
  },
  {
    baseFilename: "Pelagic zone 3",
    noDataValue: -3.39999995214436425e38,
    display: "Pelagic zone 3",
    layerId: "",
  },
  {
    baseFilename: "Plains",
    noDataValue: -3.39999995214436425e38,
    display: "Plains",
    layerId: "",
  },
  {
    baseFilename: "seamounts_buffered",
    noDataValue: -3.39999995214436425e38,
    display: "Seamounts",
    layerId: "",
  },
];

export const offshore = {
  layers: offshoreLayers.map((lyr) => {
    return { ...lyr, filename: `${lyr.baseFilename}${fileSuffix}` };
  }),
};

export default {
  STUDY_REGION_AREA_SQ_KM,
  STUDY_REGION_AREA_SQ_METERS,
  units,
  localDataUrl,
  dataBucketUrl,
  eezObjective,
  nearshore: nearshore,
  offshore: offshore,
};
