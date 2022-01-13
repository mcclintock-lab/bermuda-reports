import React from "react";
import {
  ResultsCard,
  Skeleton,
  useSketchProperties,
} from "@seasketch/geoprocessing/client-ui";
import { toNullSketchArray } from "@seasketch/geoprocessing/client-core";
import { Collapse } from "../components/Collapse";
import { ClassTable } from "../components/ClassTableNext";
import SketchClassTable from "../components/SketchClassTable";
import config, { ReportResult, ReportResultBase } from "../_config";
import {
  flattenSketchAllClassNext,
  metricsWithSketchId,
  sketchMetricPercent,
} from "../metrics/clientMetrics";

import existingProtectionsTotals from "../../data/precalc/existingProtectionsTotals.json";
const existingPrecalcTotals = existingProtectionsTotals as ReportResultBase;

const CONFIG = config.existingProtection;
const METRIC_ID = "areaOverlap";

const ExistingProtections = () => {
  const [{ isCollection }] = useSketchProperties();

  return (
    <>
      <ResultsCard
        title="Existing Protections"
        functionName="existingProtections"
        skeleton={<LoadingSkeleton />}
      >
        {(data: ReportResult) => {
          // Collection or single sketch
          const parentMetrics = metricsWithSketchId(
            sketchMetricPercent(
              data.metrics.filter((m) => m.metricId === METRIC_ID),
              existingPrecalcTotals.metrics
            ),
            [data.sketch.properties.id]
          );

          return (
            <>
              <p>
                Plans should consider and optimize for overlap with existing
                protected areas. This report summarizes the percentage of
                currently legislated areas that overlap with this plan.
              </p>
              <ClassTable
                titleText="Area Type"
                rows={parentMetrics}
                classes={CONFIG.classes}
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
  // Build agg metric objects for each child sketch in collection with percValue for each class
  const childSketches = toNullSketchArray(data.sketch);
  const childSketchIds = childSketches.map((sk) => sk.properties.id);
  const childSketchMetrics = sketchMetricPercent(
    metricsWithSketchId(
      data.metrics.filter((m) => m.metricId === METRIC_ID),
      childSketchIds
    ),
    existingPrecalcTotals.metrics
  );
  const sketchRows = flattenSketchAllClassNext(
    childSketchMetrics,
    CONFIG.classes,
    childSketches
  );
  return <SketchClassTable rows={sketchRows} classes={CONFIG.classes} />;
};

const LoadingSkeleton = () => (
  <p>
    <Skeleton style={{}}>&nbsp;</Skeleton>
  </p>
);

export default ExistingProtections;
