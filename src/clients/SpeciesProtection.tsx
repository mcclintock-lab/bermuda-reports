import React from "react";
import {
  ResultsCard,
  Skeleton,
  useSketchProperties,
} from "@seasketch/geoprocessing/client";
import config, { ReefIndexResults } from "../_config";
import { Collapse } from "../components/Collapse";
import { flattenSketchAllClass } from "../metrics/clientMetrics";
import SketchClassTable from "../components/SketchClassTable";
import { ClassTable } from "../components/ClassTable";

const CONFIG = config.reefIndex;

const SpeciesProtection = () => {
  const [{ isCollection }] = useSketchProperties();
  return (
    <>
      <ResultsCard
        title="Species Protection"
        functionName="reefIndex"
        skeleton={<LoadingSkeleton />}
      >
        {(data: ReefIndexResults) => {
          const results = Object.values(data.reefIndex);
          return (
            <>
              <p>
                Plans should prioritize areas of high quality habitat used by
                unique, rare, and/or threatened species named in the Protected
                Species Act. High quality habitat areas have been determined
                using 9 different measures of reef health. This report
                summarizes the proportion of high quality habitat within this
                plan for each measure.
              </p>
              <Collapse title="Learn more">
                <p>
                  Objective: When designing marine protected areas, prioritize
                  those areas that seek to protect habitat used by unique, rare,
                  and/or threatened species named in the Protected Species Act.
                </p>
                <p>
                  A reef index has been developed that identifies the best
                  habitat based on 9 different measures of reef health. Goals
                  have been established for each measure to prioritize
                  representative coverage of different high quality habitat
                  types.
                </p>
                <p>
                  There are areas that will score high for multiple measures of
                  reef health and may be good candidates for inclusion in a
                  plan.
                </p>
              </Collapse>
              <ClassTable
                titleText="Indicator"
                rows={results}
                classes={CONFIG.classes}
                showGoal
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

const genSketchTable = (data: ReefIndexResults) => {
  // Build agg sketch group objects with percValue for each class
  const sketchRows = flattenSketchAllClass(data.reefIndex, CONFIG.classes);
  return <SketchClassTable rows={sketchRows} classes={CONFIG.classes} />;
};

const LoadingSkeleton = () => (
  <p>
    <Skeleton style={{}}>&nbsp;</Skeleton>
  </p>
);

export default SpeciesProtection;
