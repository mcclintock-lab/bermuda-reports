import { SketchMetricSet } from "./types";
import sketchColl from "../../examples/sketches/no-full-network.json";

const areaMetrics: SketchMetricSet[] = [
  // Collection sketch, by class
  {
    sketchId: "616f1ae906f1b7772b51f190",
    sketchName: "no-full-network",
    metricId: "area",
    value: 129760135.88214482,
    classId: "eez",
  },
  {
    sketchId: "616f1ae906f1b7772b51f190",
    sketchName: "no-full-network",
    metricId: "area_perc",
    value: 0.0002786123691900815,
    classId: "eez",
  },
  {
    sketchId: "616f1ae906f1b7772b51f190",
    sketchName: "no-full-network",
    metricId: "area",
    value: 129760135.88214482,
    classId: "nearshore",
  },
  {
    sketchId: "616f1ae906f1b7772b51f190",
    sketchName: "no-full-network",
    metricId: "area_perc",
    value: 0.050598639699453905,
    classId: "nearshore",
  },
  // Subsketches, by class
  {
    sketchId: "616f1ae906f1b7772b51f18f",
    sketchName: "MPA 1",
    metricId: "area",
    value: 98813282.51586914,
    classId: "eez",
  },
  {
    sketchId: "616f1ae906f1b7772b51f18f",
    sketchName: "MPA 1",
    metricId: "area_perc",
    value: 0.00021216533538620785,
    classId: "eez",
  },
];
