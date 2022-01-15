import React from "react";
import {
  ResultsCard,
  Skeleton,
  ReportError,
  useSketchProperties,
} from "@seasketch/geoprocessing/client-ui";
import { Collapse } from "../components/Collapse";
import config, { ReportResult, ReportResultBase } from "../_config";
import {
  flattenSketchAllClassNext,
  metricsWithSketchId,
  sketchMetricPercent,
} from "../metrics/clientMetrics";
import { ClassTable } from "../components/ClassTable";
import SketchClassTable from "../components/SketchClassTable";

import habitatRestoreTotals from "../../data/precalc/habitatRestoreTotals.json";
import { toNullSketchArray } from "@seasketch/geoprocessing/client-core";
const precalcTotals = habitatRestoreTotals as ReportResultBase;

const CONFIG = config.habitatRestore;
const METRIC_ID = "areaOverlap";

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
            sketchMetricPercent(
              data.metrics.filter((m) => m.metricId === METRIC_ID),
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
                <p>
                  Objectives:
                  <ul>
                    <li>
                      Establish active restoration of areas that were formerly
                      seagrass habitats (100m2) through turtle exclusion.
                    </li>
                    <li>
                      Inventory and assess past, present and potential salt
                      marsh and mangrove habitat areas and develop a strategic
                      plan for conservation and restoration.
                    </li>
                    <li>
                      Initiate active restoration of threatened mangrove
                      habitats.
                    </li>
                    <li>
                      Initiate active restoration of damaged and/or degraded
                      coral habitats in protected areas.
                    </li>
                  </ul>
                </p>
              </Collapse>
              <ReportError>
                <ClassTable
                  titleText="RestorationType"
                  percText="% Area Within Plan"
                  rows={parentMetrics}
                  classes={CONFIG.classes}
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
  const childSketchMetrics = sketchMetricPercent(
    metricsWithSketchId(
      data.metrics.filter((m) => m.metricId === METRIC_ID),
      childSketchIds
    ),
    precalcTotals.metrics
  );
  const sketchRows = flattenSketchAllClassNext(
    childSketchMetrics,
    CONFIG.classes,
    childSketches
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

export default HabitatRestoration;
