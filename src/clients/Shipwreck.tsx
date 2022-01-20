import React from "react";
import {
  percentWithEdge,
  toNullSketchArray,
} from "@seasketch/geoprocessing/client-core";
import {
  ResultsCard,
  Skeleton,
  KeySection,
  useSketchProperties,
  ReportError,
  LayerToggle,
} from "@seasketch/geoprocessing/client-ui";

import { Collapse } from "../components/Collapse";
import {
  firstMatchingMetric,
  flattenSketchAllClassNext,
  metricsWithSketchId,
  sketchMetricPercent,
} from "../metrics/clientMetrics";
import config, { ReportResultBase, ReportResult } from "../_config";

import WreckHeatmapTotals from "../../data/precalc/WreckHeatmapTotals.json";
import SketchClassTable from "../components/SketchClassTable";
const precalcTotals = WreckHeatmapTotals as ReportResultBase;

const METRIC_ID = "sumOverlap";
const CONFIG = config;
const REPORT = CONFIG.shipwreck;
const METRIC = REPORT.metrics[METRIC_ID];

const Shipwreck = () => {
  const [{ isCollection, ...rest }] = useSketchProperties();
  return (
    <ResultsCard
      title="Shipwrecks"
      functionName="shipwreck"
      skeleton={<LoadingSkeleton />}
    >
      {(data: ReportResult) => {
        const parentShipwreckMetric = firstMatchingMetric(
          data.metrics,
          (m) => m.sketchId === data.sketch.properties.id
        );

        const shipwreckCount = parentShipwreckMetric.value;
        const shipwreckPerc = sketchMetricPercent(
          [parentShipwreckMetric],
          precalcTotals.metrics
        )[0];

        let keySection: JSX.Element;
        const percText: JSX.Element =
          shipwreckCount > 0 ? (
            <>
              {", "}
              <b>{percentWithEdge(shipwreckPerc.value)}</b> of the total.
            </>
          ) : (
            <></>
          );
        keySection = (
          <>
            This plan contains approximately{" "}
            <b>{shipwreckCount.toLocaleString()}</b> shipwrecks
            {percText}
          </>
        );

        return (
          <ReportError>
            <KeySection>{keySection}</KeySection>
            {isCollection && genSketchTable(data)}
            <LayerToggle
              label="View Shipwreck Heatmap Layer"
              layerId={METRIC.layerId}
            />
          </ReportError>
        );
      }}
    </ResultsCard>
  );
};

const genSketchTable = (data: ReportResult) => {
  const childSketches = toNullSketchArray(data.sketch);
  const childSketchIds = childSketches.map((sk) => sk.properties.id);
  const childSketchMetrics = metricsWithSketchId(data.metrics, childSketchIds);
  const sketchRows = flattenSketchAllClassNext(
    childSketchMetrics,
    METRIC.classes,
    childSketches
  );

  return (
    <Collapse title="Show by MPA">
      <SketchClassTable
        rows={sketchRows}
        classes={METRIC.classes}
        usePerc={false}
      />
    </Collapse>
  );
};

const LoadingSkeleton = () => (
  <div>
    <Skeleton style={{}}>&nbsp;</Skeleton>
  </div>
);

export default Shipwreck;
