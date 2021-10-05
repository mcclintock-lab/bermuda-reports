/**
 * Area of ocean within eez minus land in square miles. Calculated by drawing
 * sketch around hawaiian islands in original seasketch project, exporting the
 * resulting sketch, calling turf/area function on it and converting square
 * meters to square miles */
export const STUDY_REGION_AREA_SQ_METERS = 465737168307.9038;
export const STUDY_REGION_AREA_SQ_KM = STUDY_REGION_AREA_SQ_METERS / 1000;
