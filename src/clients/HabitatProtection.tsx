import React from "react";
import {
  ResultsCard,
  Skeleton,
  useSketchProperties,
} from "@seasketch/geoprocessing/client";
import config, { HabitatResults } from "../_config";
import { Collapse } from "../components/Collapse";
import { flattenSketchAllClass } from "../metrics/clientMetrics";
import SketchClassTable from "../components/SketchClassTable";
import { ClassTable } from "../components/ClassTable";
import { CategoricalClassTable } from "../components/CategoricalClassTable";
import { ClassMetricSketch } from "../util/types";

const HabitatProtection = () => {
  const [{ isCollection }] = useSketchProperties();
  return (
    <>
      <ResultsCard
        title="Habitat Protection"
        functionName="habitatProtection"
        skeleton={<LoadingSkeleton />}
      >
        {(data: HabitatResults) => {
          return (
            <>
              <p>
                Plans should ensure the representative coverage of each key
                habitat type. This report summarizes the percentage of each
                habitat that overlaps with this plan.
              </p>
              <Collapse title="Learn more">
                <p>
                  The Steering Committee approved the objective of ensuring a
                  20% representative coverage of each key habitat type when
                  designating fully protected MPAs, and higher coverage as
                  needed to satisfy other objectives. Only MPAs with a Full
                  Protection designation count towards meeting this objective.
                </p>
              </Collapse>
              <CategoricalClassTable
                titleText="Nearshore/Platform"
                layerId={config.nearshore.layerId}
                rows={Object.values(
                  data.nearshore
                ).sort((a: ClassMetricSketch, b: ClassMetricSketch) =>
                  a.name.localeCompare(b.name)
                )}
                classes={config.nearshore.layers}
                showGoal
              />
              {isCollection && (
                <Collapse title="Show Nearshore by MPA">
                  {genNearshoreSketchTable(data)}
                </Collapse>
              )}
              <ClassTable
                titleText="Offshore"
                rows={Object.values(data.offshore)}
                classes={config.offshore.layers}
                showGoal
              />
              {isCollection && (
                <Collapse title="Show Offshore by MPA">
                  {genOffshoreSketchTable(data)}
                </Collapse>
              )}
            </>
          );
        }}
      </ResultsCard>
    </>
  );
};

const genNearshoreSketchTable = (data: HabitatResults) => {
  // Build agg sketch group objects with percValue for each class
  const sketchRows = flattenSketchAllClass(
    data.nearshore,
    config.nearshore.layers
  );
  return (
    <SketchClassTable rows={sketchRows} classes={config.nearshore.layers} />
  );
};

const genOffshoreSketchTable = (data: HabitatResults) => {
  // Build agg sketch group objects with percValue for each class
  const sketchRows = flattenSketchAllClass(
    data.offshore,
    config.offshore.layers
  );
  return (
    <SketchClassTable rows={sketchRows} classes={config.offshore.layers} />
  );
};

const LoadingSkeleton = () => (
  <p>
    <Skeleton style={{}}>&nbsp;</Skeleton>
  </p>
);

export default HabitatProtection;
