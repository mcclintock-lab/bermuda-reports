import React from "react";
import {
  ReportResult,
  ReportResultBase,
  isNullSketchCollection,
  toNullSketchArray,
  flattenBySketchAllClass,
  metricsWithSketchId,
  toPercentMetric,
} from "@seasketch/geoprocessing/client-core";
import {
  Collapse,
  Skeleton,
  ResultsCard,
  useSketchProperties,
} from "@seasketch/geoprocessing/client-ui";
import config from "../_config";

import { ClassTable } from "../components/ClassTable";
import { SketchClassTable } from "../components/SketchClassTable";

import renewableTotals from "../../data/precalc/renewableTotals.json";
const precalcTotals = renewableTotals as ReportResultBase;

const REPORT = config.renewable;
const METRIC = REPORT.metrics.valueOverlap;

const RenewableEnergy = () => {
  const [{ isCollection }] = useSketchProperties();
  return (
    <>
      <ResultsCard title="Renewable Energy" functionName="renewable">
        {(data: ReportResult) => {
          // Single sketch or collection top-level
          const parentMetrics = metricsWithSketchId(
            toPercentMetric(data.metrics, precalcTotals.metrics),
            [data.sketch.properties.id]
          );

          return (
            <>
              <p>
                Potential energy production zones were identified for 4 types of
                renewable energy. This report summarizes the percentage of each
                potential use area within this plan.
              </p>
              <Collapse title="Learn more">
                <p>
                  Objective: Identify potential energy production zones that
                  recognize the physical characteristics and criteria that
                  should be considered when placing ocean renewable technologies
                  for the purpose of delineating the broadest areas where these
                  technologies could be implemented in Bermuda’s EEZ with the
                  lowest potential impact to ecosystem function.
                </p>
                <p>
                  Calculation: the Bermuda EEZ is divided into a grid and for
                  each renewable technology a suitability value is calculated.
                  The results forms a heatmap. The higher a cells value, the
                  higher the potential for using that area for energy
                  production. The percentage of potential use area within this
                  plan is then assessed. For each of the 4 renewable
                  technologies, the value of all of the grid cells within the
                  boundaries of this plan are summed, and then divided by the
                  total value of all cells in the EEZ.
                </p>
              </Collapse>
              <ClassTable
                titleText="Type"
                rows={Object.values(parentMetrics)}
                dataGroup={METRIC}
                showLayerToggle
                formatPerc
              />
              {isCollection &&
                isNullSketchCollection(data.sketch) &&
                genSketchTable(data)}
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

  return (
    <Collapse title="Show by MPA">
      <SketchClassTable rows={sketchRows} dataGroup={METRIC} formatPerc />
    </Collapse>
  );
};

export default RenewableEnergy;
