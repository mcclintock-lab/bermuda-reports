import React from "react";
import {
  Collapse,
  ClassTable,
  ResultsCard,
  Skeleton,
  SketchClassTable,
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
import reefIndexTotals from "../../data/precalc/reefIndexTotals.json";
const precalcTotals = reefIndexTotals as ReportResultBase;

const REPORT = config.speciesProtection;
const METRIC = REPORT.metrics.valueOverlap;

const SpeciesProtection = () => {
  const [{ isCollection }] = useSketchProperties();
  return (
    <>
      <ResultsCard title="Species Protection" functionName="reefIndex">
        {(data: ReportResult) => {
          // Single sketch or collection top-level
          const topMetrics = metricsWithSketchId(
            toPercentMetric(data.metrics, precalcTotals.metrics),
            [data.sketch.properties.id]
          );
          return (
            <>
              <p>
                Plans should prioritize areas of high quality habitat used by
                unique, rare, and/or threatened species named in the Protected
                Species Act. High quality habitat areas have been determined
                using 9 different measures of reef health. This report
                summarizes the proportion of high quality habitat within this
                plan for each measure.
              </p>
              <Collapse title="Learn more">
                <p>
                  Objective: When designing marine protected areas, prioritize
                  those areas that seek to protect habitat used by unique, rare,
                  and/or threatened species named in the Protected Species Act.
                </p>
                <p>
                  A reef index has been developed that identifies the best
                  habitat based on 9 different measures of reef health. Goals
                  have been established for each measure to prioritize
                  representative coverage of different high quality habitat
                  types.
                </p>
                <p>
                  There are areas that will score high for multiple measures of
                  reef health and may be good candidates for inclusion in a
                  plan.
                </p>
              </Collapse>
              <ClassTable
                titleText="Indicator"
                rows={topMetrics}
                dataGroup={METRIC}
                showGoal
                showLayerToggle
                formatPerc
              />
              {isCollection && (
                <Collapse title="Show by MPA">{genSketchTable(data)}</Collapse>
              )}
            </>
          );
        }}
      </ResultsCard>
    </>
  );
};

const genSketchTable = (data: ReportResult) => {
  const childSketches = toNullSketchArray(data.sketch);
  const childSketchIds = childSketches.map((sk) => sk.properties.id);
  const childSketchMetrics = toPercentMetric(
    metricsWithSketchId(data.metrics, childSketchIds),
    precalcTotals.metrics
  );
  const sketchRows = flattenBySketchAllClass(
    childSketchMetrics,
    METRIC.classes,
    childSketches
  );

  return <SketchClassTable rows={sketchRows} dataGroup={METRIC} formatPerc />;
};

export default SpeciesProtection;
