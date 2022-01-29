import React from "react";
import {
  ResultsCard,
  Skeleton,
  ReportError,
  useSketchProperties,
} from "@seasketch/geoprocessing/client-ui";
import {
  flattenBySketchAllClass,
  metricsWithSketchId,
  toPercentMetric,
} from "@seasketch/geoprocessing/client-core";
import { Collapse } from "../components/Collapse";
import config, { ReportResult, ReportResultBase } from "../_config";
import { ClassTable } from "../components/ClassTable";
import SketchClassTable from "../components/SketchClassTable";

import habitatRestoreTotals from "../../data/precalc/habitatRestoreTotals.json";
import { toNullSketchArray } from "@seasketch/geoprocessing/client-core";
const precalcTotals = habitatRestoreTotals as ReportResultBase;

const REPORT = config.habitatRestore;
const METRIC = REPORT.metrics.areaOverlap;

const HabitatRestoration = () => {
  const [{ isCollection }] = useSketchProperties();

  return (
    <>
      <ResultsCard
        title="Habitat Restoration"
        functionName="habitatRestore"
        skeleton={<LoadingSkeleton />}
      >
        {(data: ReportResult) => {
          // Collection or single sketch
          const parentMetrics = metricsWithSketchId(
            toPercentMetric(
              data.metrics.filter((m) => m.metricId === METRIC.metricId),
              precalcTotals.metrics
            ),
            [data.sketch.properties.id]
          );

          return (
            <>
              <p>
                Areas with restoration potential have been identified for
                multiple habitat types with the objective of identifying and
                restoring these areas. This report summarizes the amount of
                potential restoration area within this plan. It is for
                informational purposes and not a requirement for inclusion in
                MPAs.
              </p>
              <Collapse title="Learn more">
                <p>
                  A suitability analysis was conducted for multiple habitat
                  types and identified areas with restoration potential.
                </p>
                <p>Objectives:</p>
                <ul>
                  <li>
                    Establish active restoration of areas that were formerly
                    seagrass habitats (100m2) through turtle exclusion.
                  </li>
                  <li>
                    Inventory and assess past, present and potential salt marsh
                    and mangrove habitat areas and develop a strategic plan for
                    conservation and restoration.
                  </li>
                  <li>
                    Initiate active restoration of threatened mangrove habitats.
                  </li>
                  <li>
                    Initiate active restoration of damaged and/or degraded coral
                    habitats in protected areas.
                  </li>
                </ul>
              </Collapse>
              <ReportError>
                <ClassTable
                  titleText="RestorationType"
                  percText="% Area Within Plan"
                  rows={parentMetrics}
                  classes={METRIC.classes}
                />
                {isCollection && genSketchTable(data)}
              </ReportError>
            </>
          );
        }}
      </ResultsCard>
    </>
  );
};

const genSketchTable = (data: ReportResult) => {
  // Build agg metric objects for each child sketch in collection with percValue for each class
  const childSketches = toNullSketchArray(data.sketch);
  const childSketchIds = childSketches.map((sk) => sk.properties.id);
  const childSketchMetrics = toPercentMetric(
    metricsWithSketchId(
      data.metrics.filter((m) => m.metricId === METRIC.metricId),
      childSketchIds
    ),
    precalcTotals.metrics
  );
  const sketchRows = flattenBySketchAllClass(
    childSketchMetrics,
    METRIC.classes,
    childSketches
  );
  return (
    <Collapse title="Show by MPA">
      <SketchClassTable rows={sketchRows} classes={METRIC.classes} />
    </Collapse>
  );
};

const LoadingSkeleton = () => (
  <div>
    <Skeleton style={{}}>&nbsp;</Skeleton>
  </div>
);

export default HabitatRestoration;
