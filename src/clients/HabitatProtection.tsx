import React from "react";
import {
  ResultsCard,
  Skeleton,
  useSketchProperties,
} from "@seasketch/geoprocessing/client-ui";
import { toNullSketchArray } from "@seasketch/geoprocessing/client-core";
import config, { ReportResult, ReportResultBase } from "../_config";
import { Collapse } from "../components/Collapse";
import {
  flattenSketchAllClassNext,
  metricsWithSketchId,
  sketchMetricPercent,
} from "../metrics/clientMetrics";
import SketchClassTable from "../components/SketchClassTable";
import { ClassTable } from "../components/ClassTable";
import { CategoricalClassTable } from "../components/CategoricalClassTable";

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
            sketchMetricPercent(
              data.metrics.filter(
                (m) => m.metricId === NEARSHORE_METRIC.metricId && m.classId
              ),
              nearshorePrecalcTotals.metrics
            ),
            [data.sketch.properties.id]
          );
          const offshoreParentPercMetrics = metricsWithSketchId(
            sketchMetricPercent(
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
              <CategoricalClassTable
                titleText="Nearshore/Platform"
                layerId={NEARSHORE_METRIC.layerId}
                rows={nearshoreParentPercMetrics}
                classes={NEARSHORE_METRIC.classes}
                showGoal
              />
              {isCollection && (
                <Collapse title="Show Nearshore by MPA">
                  {genNearshoreSketchTable(data)}
                </Collapse>
              )}
              <ClassTable
                titleText="Offshore"
                rows={offshoreParentPercMetrics}
                classes={OFFSHORE_METRIC.classes}
                showGoal
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
  const subSketchMetrics = sketchMetricPercent(
    metricsWithSketchId(
      data.metrics.filter(
        (m) => m.metricId === NEARSHORE_METRIC.metricId && m.classId
      ),
      subSketchIds
    ),
    nearshorePrecalcTotals.metrics
  );
  const sketchRows = flattenSketchAllClassNext(
    subSketchMetrics,
    NEARSHORE_METRIC.classes,
    subSketches
  );
  return (
    <SketchClassTable rows={sketchRows} classes={NEARSHORE_METRIC.classes} />
  );
};

const genOffshoreSketchTable = (data: ReportResult) => {
  // Build agg sketch group objects with percValue for each class
  const subSketches = toNullSketchArray(data.sketch);
  const subSketchIds = subSketches.map((sk) => sk.properties.id);
  const subSketchMetrics = sketchMetricPercent(
    metricsWithSketchId(
      data.metrics.filter(
        (m) => m.metricId === OFFSHORE_METRIC.metricId && m.classId
      ),
      subSketchIds
    ),
    offshorePrecalcTotals.metrics
  );
  const sketchRows = flattenSketchAllClassNext(
    subSketchMetrics,
    OFFSHORE_METRIC.classes,
    subSketches
  );
  return (
    <SketchClassTable rows={sketchRows} classes={OFFSHORE_METRIC.classes} />
  );
};

const LoadingSkeleton = () => (
  <div>
    <Skeleton style={{}}>&nbsp;</Skeleton>
  </div>
);

export default HabitatProtection;
