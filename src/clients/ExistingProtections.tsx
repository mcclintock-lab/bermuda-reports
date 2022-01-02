import React from "react";
import {
  ResultsCard,
  Skeleton,
  useSketchProperties,
} from "@seasketch/geoprocessing/client-ui";
import { Collapse } from "../components/Collapse";
import { ClassTable } from "../components/ClassTable";
import SketchClassTable from "../components/SketchClassTable";
import config from "../_config";
import { ExistingProtectionResults } from "../_config";
import { flattenSketchAllClass } from "../metrics/clientMetrics";
// Import the results type definition from your functions to type-check your
// component render functions

const CONFIG = config.existingProtection;

const ExistingProtections = () => {
  const [{ isCollection }] = useSketchProperties();

  return (
    <>
      <ResultsCard
        title="Existing Protections"
        functionName="existingProtections"
        skeleton={<LoadingSkeleton />}
      >
        {(data: ExistingProtectionResults) => {
          const sketchRows = flattenSketchAllClass(
            data.byClass,
            CONFIG.classes
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
                rows={Object.values(data.byClass).sort((a, b) =>
                  a.name.localeCompare(b.name)
                )}
                classes={CONFIG.classes}
              />
              {isCollection && (
                <Collapse title="Show by MPA">
                  <SketchClassTable
                    rows={sketchRows}
                    classes={CONFIG.classes}
                  />
                </Collapse>
              )}
            </>
          );
        }}
      </ResultsCard>
    </>
  );
};

const LoadingSkeleton = () => (
  <p>
    <Skeleton style={{}}>&nbsp;</Skeleton>
  </p>
);

export default ExistingProtections;
