import React from "react";
import {
  Collapse,
  ResultsCard,
  Skeleton,
  useSketchProperties,
} from "@seasketch/geoprocessing/client-ui";
import {
  ReportResult,
  ReportResultBase,
  toNullSketchArray,
  flattenBySketchAllClass,
  metricsWithSketchId,
  toPercentMetric,
} from "@seasketch/geoprocessing/client-core";
import { ClassTable } from "../components/ClassTable";
import { SketchClassTable } from "../components/SketchClassTable";
import config from "../_config";

import offshoreHabitatTotals from "../../data/precalc/offshoreHabitatTotals.json";
const offshorePrecalcTotals = offshoreHabitatTotals as ReportResultBase;

const REPORT = config.habitatProtectionOffshore;
const OFFSHORE_METRIC = REPORT.metrics.offshoreAreaOverlap;

const HabitatProtectionOffshore = () => {
  const [{ isCollection }] = useSketchProperties();
  return (
    <>
      <ResultsCard
        title="Habitat Protection - Offshore"
        functionName="habitatProtectionOffshore"
      >
        {(data: ReportResult) => {
          // Collection top-level or single sketch.
          const offshoreParentPercMetrics = metricsWithSketchId(
            toPercentMetric(
              data.metrics.filter(
                (m) => m.metricId === OFFSHORE_METRIC.metricId
              ),
              offshorePrecalcTotals.metrics
            ),
            [data.sketch.properties.id]
          );

          return (
            <>
              <p>
                Plans should ensure the representative coverage of each key
                habitat type. This report summarizes the percentage of each
                offshore habitat that overlaps with this plan.
              </p>
              <Collapse title="Learn more">
                <p>
                  The Steering Committee approved the objective of ensuring a
                  20% representative coverage of each key habitat type when
                  designating fully protected MPAs, and higher coverage as
                  needed to satisfy other objectives. Only MPAs with a Full
                  Protection designation count towards meeting this objective.
                </p>
              </Collapse>
              <ClassTable
                titleText="Habitat"
                rows={offshoreParentPercMetrics}
                dataGroup={OFFSHORE_METRIC}
                showGoal
                showLayerToggle
                formatPerc
              />
              {isCollection && (
                <Collapse title="Show Offshore by MPA">
                  {genOffshoreSketchTable(data)}
                </Collapse>
              )}
            </>
          );
        }}
      </ResultsCard>
    </>
  );
};

const genOffshoreSketchTable = (data: ReportResult) => {
  // Build agg sketch group objects with percValue for each class
  const subSketches = toNullSketchArray(data.sketch);
  const subSketchIds = subSketches.map((sk) => sk.properties.id);
  const subSketchMetrics = toPercentMetric(
    metricsWithSketchId(
      data.metrics.filter(
        (m) => m.metricId === OFFSHORE_METRIC.metricId && m.classId
      ),
      subSketchIds
    ),
    offshorePrecalcTotals.metrics
  );
  const sketchRows = flattenBySketchAllClass(
    subSketchMetrics,
    OFFSHORE_METRIC.classes,
    subSketches
  );
  return (
    <SketchClassTable
      rows={sketchRows}
      dataGroup={OFFSHORE_METRIC}
      formatPerc
    />
  );
};

export default HabitatProtectionOffshore;
