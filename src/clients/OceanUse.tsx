import React from "react";
import {
  ResultsCard,
  Skeleton,
  useSketchProperties,
} from "@seasketch/geoprocessing/client-ui";
import { Collapse } from "../components/Collapse";
import config, { OceanUseResults } from "../_config";
import { flattenSketchAllClass } from "../metrics/clientMetrics";
import { ClassTable } from "../components/ClassTable";
import SketchClassTable from "../components/SketchClassTable";

const CONFIG = config.oceanUse;

const OceanUse = () => {
  const [{ isCollection }] = useSketchProperties();
  return (
    <>
      <ResultsCard
        title="Ocean Use"
        functionName="oceanUse"
        skeleton={<LoadingSkeleton />}
      >
        {(data: OceanUseResults) => {
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

              {genOverallUseTable(data)}
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

const genOverallUseTable = (data: OceanUseResults) => {
  return (
    <ClassTable
      titleText="Sector"
      percText="% Value In Plan"
      rows={Object.values(data.byClass)}
      classes={CONFIG.classes}
    />
  );
};

const genSketchTable = (data: OceanUseResults) => {
  // Build agg sketch group objects with percValue for each class
  const sketchRows = flattenSketchAllClass(data.byClass, CONFIG.classes);
  return <SketchClassTable rows={sketchRows} classes={CONFIG.classes} />;
};

const LoadingSkeleton = () => (
  <p>
    <Skeleton style={{}}>&nbsp;</Skeleton>
  </p>
);

export default OceanUse;
