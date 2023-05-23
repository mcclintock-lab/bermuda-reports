import React from "react";
import {
  Collapse,
  ResultsCard,
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

import existingProtectionsTotals from "../../data/precalc/existingProtectionsTotals.json";
const existingPrecalcTotals = existingProtectionsTotals as ReportResultBase;

const REPORT = config.existingProtection;
const METRIC = REPORT.metrics.areaOverlap;

const ExistingProtections = () => {
  const [{ isCollection }] = useSketchProperties();

  return (
    <>
      <ResultsCard
        title="Existing Protections"
        functionName="existingProtections"
      >
        {(data: ReportResult) => {
          // Collection or single sketch
          const parentMetrics = metricsWithSketchId(
            toPercentMetric(
              data.metrics.filter((m) => m.metricId === METRIC.metricId),
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
                dataGroup={METRIC}
                formatPerc
                showLayerToggle
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
  const childSketchMetrics = toPercentMetric(
    metricsWithSketchId(
      data.metrics.filter((m) => m.metricId === METRIC.metricId),
      childSketchIds
    ),
    existingPrecalcTotals.metrics
  );
  const sketchRows = flattenBySketchAllClass(
    childSketchMetrics,
    METRIC.classes,
    childSketches
  );
  return <SketchClassTable rows={sketchRows} dataGroup={METRIC} formatPerc />;
};

export default React.memo(ExistingProtections);
