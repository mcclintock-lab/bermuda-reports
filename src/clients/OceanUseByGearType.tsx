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
import config from "../_config";
import { ClassTable } from "../components/ClassTable";
import { SketchClassTable } from "../components/SketchClassTable";

import oceanUseByGearTypeTotals from "../../data/precalc/oceanUseByGearTypeTotals.json";
const precalcTotals = oceanUseByGearTypeTotals as ReportResultBase;

const REPORT = config.oceanUseByGearType;
const METRIC = REPORT.metrics.valueOverlap;

const OceanUseByGearType = () => {
  const [{ isCollection }] = useSketchProperties();
  return (
    <>
      <ResultsCard
        title="Ocean Use - By Gear Type"
        functionName="oceanUseByGearType"
      >
        {(data: ReportResult) => {
          // Single sketch or collection top-level
          const parentMetrics = metricsWithSketchId(
            toPercentMetric(data.metrics, precalcTotals.metrics),
            [data.sketch.properties.id]
          );

          return (
            <>
              <p>
                Plans should consider the value of different areas for different
                gear types. This report summarizes how much value falls within
                this MPA plan for each gear type. The higher the percentage, the
                greater the potential impact if access or activities are
                restricted.
              </p>
              <p></p>

              <Collapse title="Learn more">
                <p>
                  To capture the value each gear type places on different areas
                  within Bermuda waters, an Ocean Use Survey was conducted.
                  Individuals identified the sectors they participate in, and
                  were asked to draw the areas they use relative to that gear
                  type and assign a value of importance. Individual responses
                  were then combined to produce aggregate heatmaps by sector.
                </p>
                <p>
                  Note, the resulting heatmaps are only representative of the
                  individuals that were surveyed.
                </p>
                <p>
                  <a
                    target="_blank"
                    href="https://seasketch.github.io/heatmap/"
                  >
                    Read more
                  </a>{" "}
                  about how the heatmaps are generated from ocean use surveys.
                </p>
              </Collapse>

              <ClassTable
                titleText="Gear Type"
                valueColText="% Value In Plan"
                rows={parentMetrics}
                dataGroup={METRIC}
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

export default React.memo(OceanUseByGearType);
