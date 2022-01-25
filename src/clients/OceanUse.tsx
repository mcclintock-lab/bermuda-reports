import React from "react";
import {
  ResultsCard,
  Skeleton,
  useSketchProperties,
} from "@seasketch/geoprocessing/client-ui";
import { toNullSketchArray } from "@seasketch/geoprocessing/client-core";
import { Collapse } from "../components/Collapse";
import config, { ReportResult, ReportResultBase } from "../_config";
import {
  flattenSketchAllClassNext,
  metricsWithSketchId,
  sketchMetricPercent,
} from "../metrics/clientMetrics";
import { ClassTable } from "../components/ClassTable";
import SketchClassTable from "../components/SketchClassTable";

import oceanUseTotals from "../../data/precalc/oceanUseTotals.json";
const precalcTotals = oceanUseTotals as ReportResultBase;

const REPORT = config.oceanUse;
const METRIC = REPORT.metrics.valueOverlap;

const OceanUse = () => {
  const [{ isCollection }] = useSketchProperties();
  return (
    <>
      <ResultsCard
        title="Ocean Use"
        functionName="oceanUse"
        skeleton={<LoadingSkeleton />}
      >
        {(data: ReportResult) => {
          // Single sketch or collection top-level
          const parentMetrics = metricsWithSketchId(
            sketchMetricPercent(data.metrics, precalcTotals.metrics),
            [data.sketch.properties.id]
          );

          return (
            <>
              <p>
                Plans should ensure continued access to the most highly valued
                areas for each sector. This report summarizes how much value
                falls within this MPA plan for each sector . The higher the
                percentage, the greater the potential impact if access or
                activities are restricted.
              </p>
              <p></p>

              <Collapse title="Learn more">
                <p>
                  To capture the value each sector places on different areas
                  within Bermuda waters, an Ocean Use Survey was conducted.
                  Individuals identified the sectors they participate in, and
                  were asked to draw the areas they use relative to that sector
                  and assign a value of importance. Individual responses were
                  then combined to produce aggregate heatmaps by sector.
                </p>
                <p>
                  Note, the resulting heatmaps are only representative of the
                  individuals that were surveyed.
                </p>
                <p>
                  <a
                    target="_blank"
                    href="https://seasketch.github.io/python-sap-map/algorithm.html"
                  >
                    Read more
                  </a>{" "}
                  about how the heatmaps are generated from ocean use surveys.
                </p>
              </Collapse>

              <ClassTable
                titleText="Sector"
                percText="% Value In Plan"
                rows={parentMetrics}
                classes={METRIC.classes}
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
  const childSketchMetrics = sketchMetricPercent(
    metricsWithSketchId(data.metrics, childSketchIds),
    precalcTotals.metrics
  );
  const sketchRows = flattenSketchAllClassNext(
    childSketchMetrics,
    METRIC.classes,
    childSketches
  );

  return <SketchClassTable rows={sketchRows} classes={METRIC.classes} />;
};

const LoadingSkeleton = () => (
  <div>
    <Skeleton style={{}}>&nbsp;</Skeleton>
  </div>
);

export default OceanUse;
