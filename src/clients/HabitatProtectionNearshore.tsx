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
  metricsWithSketchId,
  toPercentMetric,
  flattenBySketchAllClass,
} from "@seasketch/geoprocessing/client-core";
import { ClassTable } from "../components/ClassTable";
import { SketchClassTable } from "../components/SketchClassTable";
import config from "../_config";

import nearshoreHabitatTotals from "../../data/precalc/nearshoreHabitatTotals.json";
import { flattenBySketchAllClassMemo } from "../util/helpers";
const nearshorePrecalcTotals = nearshoreHabitatTotals as ReportResultBase;

const REPORT = config.habitatProtectionNearshore;
const NEARSHORE_METRIC = REPORT.metrics.nearshoreAreaOverlap;

const HabitatProtectionNearshore = () => {
  const [{ isCollection }] = useSketchProperties();
  return (
    <>
      <ResultsCard
        title="Habitat Protection - Nearshore"
        functionName="habitatProtectionNearshore"
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

          return (
            <>
              <p>
                Plans should ensure the representative coverage of each key
                habitat type. This report summarizes the percentage of each
                nearshore/platform habitat that overlaps with this plan.
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
  const sketchRows = flattenBySketchAllClassMemo(
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

export default React.memo(HabitatProtectionNearshore);
