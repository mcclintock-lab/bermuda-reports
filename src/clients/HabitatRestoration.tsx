import React from "react";
import {
  ResultsCard,
  Skeleton,
  keyBy,
  ReportError,
  useSketchProperties,
} from "@seasketch/geoprocessing/client";
import { Collapse } from "../components/Collapse";
import config, { HabitatRestoreResults } from "../_config";
import { ClassMetric } from "../util/types";
import { flattenSketchAllClass } from "../metrics/clientMetrics";
import { ClassTable } from "../components/ClassTable";
import SketchClassTable from "../components/SketchClassTable";

const LAYERS = config.habitatRestore.layers;

const HabitatRestoration = () => {
  const [{ isCollection }] = useSketchProperties();

  return (
    <>
      <ResultsCard
        title="Habitat Restoration"
        functionName="habitatRestore"
        skeleton={<LoadingSkeleton />}
      >
        {(data: HabitatRestoreResults) => {
          const results = Object.values(data.byClass);
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
                {isCollection ? genNetwork(data) : genSingle(data)}
              </ReportError>
            </>
          );
        }}
      </ResultsCard>
    </>
  );
};

const genSingle = (data: HabitatRestoreResults) => {
  return <>{genTable(Object.values(data.byClass))}</>;
};

const genNetwork = (data: HabitatRestoreResults) => {
  return (
    <>
      {genTable(Object.values(data.byClass))}
      <Collapse title="Show by MPA">{genSketchTable(data)}</Collapse>
    </>
  );
};

const genTable = (data: ClassMetric[]) => {
  return (
    <ClassTable
      titleText="RestorationType"
      percText="% Area Within Plan"
      rows={data}
      classes={LAYERS}
    />
  );
};

const genSketchTable = (data: HabitatRestoreResults) => {
  // Build agg sketch group objects with percValue for each class
  const sketchRows = flattenSketchAllClass(data.byClass, LAYERS);
  return <SketchClassTable rows={sketchRows} classes={LAYERS} />;
};

const LoadingSkeleton = () => (
  <p>
    <Skeleton style={{}}>&nbsp;</Skeleton>
  </p>
);

export default HabitatRestoration;
