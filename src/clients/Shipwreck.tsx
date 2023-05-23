import React from "react";
import {
  ReportResultBase,
  ReportResult,
  percentWithEdge,
  toNullSketchArray,
  firstMatchingMetric,
  metricsWithSketchId,
  toPercentMetric,
  flattenBySketchAllClass,
} from "@seasketch/geoprocessing/client-core";
import {
  Collapse,
  KeySection,
  LayerToggle,
  ResultsCard,
  ReportError,
  Skeleton,
  useSketchProperties,
} from "@seasketch/geoprocessing/client-ui";

import { SketchClassTable } from "../components/SketchClassTable";

import config from "../_config";
import WreckHeatmapTotals from "../../data/precalc/WreckHeatmapTotals.json";
const precalcTotals = WreckHeatmapTotals as ReportResultBase;

const REPORT = config.shipwreck;
const METRIC = REPORT.metrics.valueOverlap;

const Shipwreck = () => {
  const [{ isCollection, ...rest }] = useSketchProperties();
  return (
    <ResultsCard title="Shipwrecks" functionName="shipwreck">
      {(data: ReportResult) => {
        const parentShipwreckMetric = firstMatchingMetric(
          data.metrics,
          (m) => m.sketchId === data.sketch.properties.id
        );

        const shipwreckCount = parentShipwreckMetric.value;
        const shipwreckPerc = toPercentMetric(
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
  const sketchRows = flattenBySketchAllClass(
    childSketchMetrics,
    METRIC.classes,
    childSketches
  );

  return (
    <Collapse title="Show by MPA">
      <SketchClassTable rows={sketchRows} dataGroup={METRIC} />
    </Collapse>
  );
};

export default React.memo(Shipwreck);
