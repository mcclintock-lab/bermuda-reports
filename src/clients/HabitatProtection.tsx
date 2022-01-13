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
import { ClassTable } from "../components/ClassTableNext";
import { CategoricalClassTable } from "../components/CategoricalClassTableNext";

import nearshoreHabitatTotals from "../../data/precalc/nearshoreHabitatTotals.json";
const nearshorePrecalcTotals = nearshoreHabitatTotals as ReportResultBase;

import offshoreHabitatTotals from "../../data/precalc/offshoreHabitatTotals.json";
const offshorePrecalcTotals = offshoreHabitatTotals as ReportResultBase;

const NEARSHORE_METRIC_ID = "nearshore";
const OFFSHORE_METRIC_ID = "offshore";

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
              data.metrics.filter((m) => m.metricId === NEARSHORE_METRIC_ID),
              nearshorePrecalcTotals.metrics
            ),
            [data.sketch.properties.id]
          );
          const offshoreParentPercMetrics = metricsWithSketchId(
            sketchMetricPercent(
              data.metrics.filter((m) => m.metricId === OFFSHORE_METRIC_ID),
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
                layerId={config.nearshore.layerId}
                rows={nearshoreParentPercMetrics}
                classes={config.nearshore.classes}
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
                classes={config.offshore.classes}
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
      data.metrics.filter((m) => m.metricId === NEARSHORE_METRIC_ID),
      subSketchIds
    ),
    nearshorePrecalcTotals.metrics
  );
  const sketchRows = flattenSketchAllClassNext(
    subSketchMetrics,
    config.nearshore.classes,
    subSketches
  );
  return (
    <SketchClassTable rows={sketchRows} classes={config.nearshore.classes} />
  );
};

const genOffshoreSketchTable = (data: ReportResult) => {
  // Build agg sketch group objects with percValue for each class
  const subSketches = toNullSketchArray(data.sketch);
  const subSketchIds = subSketches.map((sk) => sk.properties.id);
  const subSketchMetrics = sketchMetricPercent(
    metricsWithSketchId(
      data.metrics.filter((m) => m.metricId === OFFSHORE_METRIC_ID),
      subSketchIds
    ),
    offshorePrecalcTotals.metrics
  );
  const sketchRows = flattenSketchAllClassNext(
    subSketchMetrics,
    config.offshore.classes,
    subSketches
  );
  return (
    <SketchClassTable rows={sketchRows} classes={config.offshore.classes} />
  );
};

const LoadingSkeleton = () => (
  <p>
    <Skeleton style={{}}>&nbsp;</Skeleton>
  </p>
);

export default HabitatProtection;
