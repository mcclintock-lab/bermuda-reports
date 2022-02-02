import React from "react";
import {
  Collapse,
  ClassTable,
  SketchClassTable,
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
import config from "../_config";

import nearshoreHabitatTotals from "../../data/precalc/nearshoreHabitatTotals.json";
const nearshorePrecalcTotals = nearshoreHabitatTotals as ReportResultBase;

import offshoreHabitatTotals from "../../data/precalc/offshoreHabitatTotals.json";
const offshorePrecalcTotals = offshoreHabitatTotals as ReportResultBase;

const REPORT = config.habitatProtection;
const NEARSHORE_METRIC = REPORT.metrics.nearshoreAreaOverlap;
const OFFSHORE_METRIC = REPORT.metrics.offshoreAreaOverlap;

const HabitatProtection = () => {
  const [{ isCollection }] = useSketchProperties();
  return (
    <>
      <ResultsCard
        title="Habitat Protection"
        functionName="habitatProtection"
        skeleton={<LoadingSkeleton />}
      >
        {(data: ReportResult) => {
          // Collection top-level or single sketch.
          const nearshoreParentPercMetrics = metricsWithSketchId(
            toPercentMetric(
              data.metrics.filter(
                (m) => m.metricId === NEARSHORE_METRIC.metricId && m.classId
              ),
              nearshorePrecalcTotals.metrics
            ),
            [data.sketch.properties.id]
          );
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
                habitat that overlaps with this plan.
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
                titleText="Nearshore/Platform"
                rows={nearshoreParentPercMetrics}
                dataGroup={NEARSHORE_METRIC}
                showGoal
                showLayerToggle
                formatPerc
              />
              {isCollection && (
                <Collapse title="Show Nearshore by MPA">
                  {genNearshoreSketchTable(data)}
                </Collapse>
              )}
              <ClassTable
                titleText="Offshore"
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

const genNearshoreSketchTable = (data: ReportResult) => {
  // Build agg sketch group objects with percValue for each class
  const subSketches = toNullSketchArray(data.sketch);
  const subSketchIds = subSketches.map((sk) => sk.properties.id);
  const subSketchMetrics = toPercentMetric(
    metricsWithSketchId(
      data.metrics.filter(
        (m) => m.metricId === NEARSHORE_METRIC.metricId && m.classId
      ),
      subSketchIds
    ),
    nearshorePrecalcTotals.metrics
  );
  const sketchRows = flattenBySketchAllClass(
    subSketchMetrics,
    NEARSHORE_METRIC.classes,
    subSketches
  );
  return (
    <SketchClassTable
      rows={sketchRows}
      dataGroup={NEARSHORE_METRIC}
      formatPerc
    />
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

const LoadingSkeleton = () => (
  <div>
    <Skeleton style={{}}>&nbsp;</Skeleton>
  </div>
);

export default HabitatProtection;
