import React from "react";
import {
  isNullSketchCollection,
  NullSketchCollection,
  ResultsCard,
  Skeleton,
  toNullSketchArray,
  useSketchProperties,
} from "@seasketch/geoprocessing/client";
import config, { RenewableResults, RenewableBaseResults } from "../_config";
import { Collapse } from "../components/Collapse";
import { ClassTable } from "../components/ClassTableNext";
import SketchClassTable from "../components/SketchClassTable";
import {
  flattenSketchAllClassNext,
  sketchMetricFilter,
  getSketchCollectionIds,
} from "../metrics/clientMetrics";
import { sketchMetricPercent } from "../metrics/clientMetrics";

import renewableTotals from "../../data/precalc/renewableTotals.json";
const precalcTotals = renewableTotals as RenewableBaseResults;

const CONFIG = config.renewable;

const RenewableEnergy = () => {
  const [{ isCollection }] = useSketchProperties();
  return (
    <>
      <ResultsCard
        title="Renewable Energy"
        functionName="renewable"
        skeleton={<LoadingSkeleton />}
      >
        {(data: RenewableResults) => {
          // Derive percent metrics from raw area overlap metrics
          const percMetrics = sketchMetricPercent(
            data.metrics,
            precalcTotals.metrics
          );
          const collectionMetrics = sketchMetricFilter(
            [data.sketch.properties.id],
            percMetrics
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
                rows={Object.values(collectionMetrics)}
                classes={CONFIG.classes}
              />
              {isCollection &&
                isNullSketchCollection(data.sketch) &&
                genCollection(percMetrics, data.sketch)}
            </>
          );
        }}
      </ResultsCard>
    </>
  );
};

const genCollection = (
  metrics: RenewableResults["metrics"],
  sketch: NullSketchCollection
) => {
  const subSketches = toNullSketchArray(sketch);
  const subSketchIds = getSketchCollectionIds(sketch);
  const subSketchMetrics = sketchMetricFilter(subSketchIds, metrics);
  const sketchRows = flattenSketchAllClassNext(
    subSketchMetrics,
    CONFIG.classes,
    subSketches
  );
  return (
    <Collapse title="Show by MPA">
      <SketchClassTable rows={sketchRows} classes={CONFIG.classes} />
    </Collapse>
  );
};

const LoadingSkeleton = () => (
  <p>
    <Skeleton style={{}}>&nbsp;</Skeleton>
  </p>
);

export default RenewableEnergy;
