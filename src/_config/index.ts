/**
 * Area of ocean within eez minus land in square miles. Calculated by drawing
 * sketch around hawaiian islands in original seasketch project, exporting the
 * resulting sketch, calling turf/area function on it and converting square
 * meters to square miles */
export const STUDY_REGION_AREA_SQ_METERS = 465737168307.9038;
export const STUDY_REGION_AREA_SQ_KM = STUDY_REGION_AREA_SQ_METERS / 1000;
24031748;

export const units = "imperial";

export const dataBucketUrl =
  process.env.NODE_ENV === "test"
    ? `http://127.0.0.1:8080/`
    : `https://gp-hawaii-reports-next-datasets.s3.us-west-1.amazonaws.com/`;
