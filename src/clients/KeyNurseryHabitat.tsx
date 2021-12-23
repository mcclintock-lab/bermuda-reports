import React from "react";
import {
  ResultsCard,
  Skeleton,
  ReportError,
  useSketchProperties,
  percentWithEdge,
  UserAttribute,
  Table,
  Column,
  keyBy,
  capitalize,
  percentGoalWithEdge,
} from "@seasketch/geoprocessing/client";
// Import the results type definition from your functions to type-check your
// component render functions
import config, {
  HabitatNurseryResults,
  HabitatNurseryLevelResults,
} from "../_config";
import {
  ClassMetrics,
  GroupMetricAgg,
  GroupMetricSketchAgg,
} from "../metrics/types";
import {
  IucnCategory,
  getCategoryForActivities,
} from "../util/iucnProtectionLevel";
import { ObjectiveStatus } from "../components/ObjectiveStatus";
import { Collapse } from "../components/Collapse";
import { Pill, LevelPill } from "../components/Pill";
import { ClassMetric } from "../metrics/types";
import { LayerToggle } from "@seasketch/geoprocessing/client";
import { LevelCircleRow } from "../components/Circle";
import { flattenGroup, flattenGroupSketch } from "../metrics/clientMetrics";
import { ReportTableStyled } from "../components/ReportTableStyled";
import { SmallReportTableStyled } from "../components/SmallReportTableStyled";

import habitatNurseryTotals from "../../data/precalc/habitatNurseryTotals.json";
const precalcTotals = habitatNurseryTotals as HabitatNurseryResults;

const CONFIG = config.habitatNursery;

const sumValue = (metrics: ClassMetrics) =>
  Object.values(metrics).reduce(
    (sumSoFar, metric) => sumSoFar + metric.value,
    0
  );
const getPercValue = (metrics: ClassMetrics, total: number) =>
  sumValue(metrics) / total;

const KeyNurseryHabitat = () => {
  const [{ isCollection, userAttributes }] = useSketchProperties();

  let category: IucnCategory;
  if (!isCollection) {
    const activityProp = userAttributes.find(
      (a) => a.exportId === "ACTIVITIES"
    ) as UserAttribute | undefined;
    if (!activityProp)
      throw new Error("Missing activities in sketch, something is not right");
    const activities =
      typeof activityProp.value === "string"
        ? activityProp.value === ""
          ? []
          : JSON.parse(activityProp.value)
        : activityProp.value;
    category = getCategoryForActivities(activities);
  }

  return (
    <>
      <ResultsCard
        title="Key Nursery Habitat"
        functionName="habitatNursery"
        skeleton={<LoadingSkeleton />}
      >
        {(data: HabitatNurseryLevelResults) => {
          return (
            <ReportError>
              {isCollection ? genNetwork(data) : genSingle(data, category)}
            </ReportError>
          );
        }}
      </ResultsCard>
    </>
  );
};

const genSingle = (
  data: HabitatNurseryLevelResults,
  category: IucnCategory
) => {
  return (
    <>
      {genSingleObjective(
        category,
        config.objectives.habitatNursery,
        flattenGroupSketch(
          data.byLevel,
          precalcTotals.overall.value,
          CONFIG.classes
        )[0].percValue
      )}
      {genHabitatTable(Object.values(data.byClass))}
      {genHelp()}
    </>
  );
};

const genNetwork = (data: HabitatNurseryLevelResults) => {
  // Build agg group objects with percValue for each class
  const levelRows: GroupMetricAgg[] = flattenGroup(
    data.byLevel,
    precalcTotals.overall.value
  );

  // Build agg sketch group objects with percValue for each class
  // groupId, sketchId, lagoon, mangrove, seagrass, total
  const sketchRows = flattenGroupSketch(
    data.byLevel,
    precalcTotals.overall.value,
    CONFIG.classes
  );

  return (
    <>
      {genNetworkObjective(data, config.objectives.habitatNursery)}
      {genGroupTable(levelRows)}
      <Collapse title="Show by MPA">{genSketchTable(sketchRows)}</Collapse>
      {genHelp()}
      {genHabitatToggles()}
    </>
  );
};

const genHabitatToggles = () => {
  return (
    <>
      {CONFIG.classes.map((curClass) => (
        <LayerToggle
          label={`Show ${curClass.display} Layer`}
          layerId={curClass.layerId}
        />
      ))}
    </>
  );
};

const genSketchTable = (sketchRows: GroupMetricSketchAgg[]) => {
  const classColumns: Column<GroupMetricSketchAgg>[] = CONFIG.classes.map(
    (curClass) => ({
      Header: curClass.display,
      accessor: (row) => percentWithEdge(row[curClass.classId] as number),
    })
  );

  const columns: Column<GroupMetricSketchAgg>[] = [
    {
      Header: "MPA",
      accessor: (row) => (
        <LevelCircleRow level={row.groupId} rowText={row.sketchName} />
      ),
    },
    ...classColumns,
    {
      Header: "Total",
      accessor: (row) => {
        return (
          <LevelPill level={row.groupId}>
            {percentWithEdge(row.percValue as number)}
          </LevelPill>
        );
      },
    },
  ];

  return (
    <SmallReportTableStyled>
      <Table
        className="styled"
        columns={columns}
        data={sketchRows.sort((a, b) => a.groupId.localeCompare(b.groupId))}
      />
    </SmallReportTableStyled>
  );
};

const genGroupTable = (groupRows: GroupMetricAgg[]) => {
  const classColumns: Column<GroupMetricAgg>[] = CONFIG.classes.map(
    (curClass) => ({
      Header: curClass.display,
      accessor: (row) => percentWithEdge(row[curClass.classId] as number),
      style: { width: "10%" },
    })
  );

  const columns: Column<GroupMetricAgg>[] = [
    {
      Header: "By Protection Level:",
      accessor: (row) => (
        <LevelCircleRow
          level={row.groupId}
          circleText={`${row.numSketches}`}
          rowText={
            <>
              <b>{capitalize(row.groupId)}</b> Protection MPA
              {row.numSketches === 1 ? "" : "s"}
            </>
          }
        />
      ),
    },
    ...classColumns,
    {
      Header: "Total",
      accessor: (row) => {
        return (
          <LevelPill level={row.groupId}>
            {percentWithEdge(row.percValue as number)}
          </LevelPill>
        );
      },
    },
  ];

  return (
    <SmallReportTableStyled>
      <Table
        className="styled"
        columns={columns}
        data={groupRows.sort((a, b) => a.groupId.localeCompare(b.groupId))}
      />
    </SmallReportTableStyled>
  );
};

const genHabitatTable = (data: ClassMetric[]) => {
  const classesByName = keyBy(CONFIG.classes, (curClass) => curClass.classId);

  const columns: Column<ClassMetric>[] = [
    {
      Header: "Habitat Type",
      accessor: (row) => classesByName[row.name].display,
      style: { width: "30%" },
    },
    {
      Header: "% Within Plan",
      style: { textAlign: "right", width: "30%" },
      accessor: (row, index) => percentWithEdge(row.percValue),
    },
    {
      Header: "Show Map",
      accessor: (row) => (
        <LayerToggle
          simple
          layerId={classesByName[row.name].layerId}
          style={{ marginTop: 0, marginLeft: 15 }}
        />
      ),
      style: { width: "20%" },
    },
  ];

  return (
    <ReportTableStyled>
      <Table className="styled" columns={columns} data={data} />
    </ReportTableStyled>
  );
};

/**
 * Single objective status component
 */
const genSingleObjective = (
  category: IucnCategory,
  objective: number,
  actual: number
) => {
  let objectiveCmp;
  switch (category.level) {
    case "full":
      objectiveCmp = (
        <ObjectiveStatus
          status="yes"
          msg={
            <>
              This full protection MPA contains{" "}
              <b>
                {percentWithEdge(actual, {
                  digits: 0,
                  lower: 0.001,
                  upperBound: objective,
                  upper: objective - 0.001,
                })}
              </b>{" "}
              of known key nursery habitat and counts toward protecting{" "}
              <b>{percentWithEdge(objective, { digits: 0, lower: 0.001 })}</b>{" "}
            </>
          }
        />
      );
    case "high":
      objectiveCmp = (
        <ObjectiveStatus
          status="maybe"
          msg={
            <>
              This high protection MPA contains{" "}
              <b>
                {percentWithEdge(actual, {
                  digits: 0,
                  lower: 0.001,
                  upperBound: objective,
                  upper: objective - 0.001,
                })}
              </b>{" "}
              of known key nursery habitat and <b>may</b> count towards
              protecting{" "}
              <b>{percentWithEdge(objective, { digits: 0, lower: 0.001 })}</b>{" "}
            </>
          }
        />
      );
    default:
      objectiveCmp = (
        <ObjectiveStatus
          status="no"
          msg={
            <>
              This low protection MPA contains{" "}
              <b>
                {percentWithEdge(actual, {
                  digits: 0,
                  lower: 0.001,
                  upperBound: objective,
                  upper: objective - 0.001,
                })}
              </b>{" "}
              of known key nursery habitat and <b>does not</b> count towards
              protecting{" "}
              <b>{percentWithEdge(objective, { digits: 0, lower: 0.001 })}</b>{" "}
            </>
          }
        />
      );
  }
  return <div style={{ paddingBottom: 20 }}>{objectiveCmp}</div>;
};

const genNetworkObjective = (
  data: HabitatNurseryLevelResults,
  objective: number
) => {
  const fullPerc = getPercValue(data.byLevel.full, precalcTotals.overall.value);
  const highPerc = getPercValue(data.byLevel.high, precalcTotals.overall.value);
  const needed = objective - fullPerc - highPerc;

  const fullPercDisplay = percentGoalWithEdge(fullPerc, objective);
  const highPercDisplay = percentGoalWithEdge(highPerc, objective);
  const combinedPercDisplay = percentGoalWithEdge(
    fullPerc + highPerc,
    objective
  );

  const progressMsg = (
    <>
      <div style={{ display: "flex", paddingTop: 15 }}>
        <span style={{ paddingBottom: 15, width: 100 }}>So far:</span>
        <span>
          <LevelPill level="full">{fullPercDisplay} Full</LevelPill> +{" "}
          <LevelPill level="high">{highPercDisplay} High</LevelPill> ={" "}
          <Pill>{combinedPercDisplay}</Pill>
        </span>
      </div>
      {needed > 0 && (
        <div style={{ display: "flex" }}>
          <span style={{ width: 100 }}>Still needs:</span>
          <span>
            <Pill>{percentWithEdge(needed, { lower: 0.1, digits: 1 })}</Pill>
          </span>
        </div>
      )}
    </>
  );

  let objectiveCmp;
  if (fullPerc > objective) {
    objectiveCmp = (
      <ObjectiveStatus
        status="yes"
        msg={
          <>
            This plan meets the objective of protecting{" "}
            <b>{percentWithEdge(objective)}</b> of key nursery habitat.
          </>
        }
      />
    );
  } else if (fullPerc + highPerc > objective) {
    objectiveCmp = (
      <ObjectiveStatus
        status="maybe"
        msg={
          <>
            <div>
              This plan <b>may</b> meet the objective of protecting{" "}
              <b>{percentWithEdge(objective)}</b> of key nursery habitat.
            </div>
            {progressMsg}
          </>
        }
      />
    );
  } else {
    objectiveCmp = (
      <ObjectiveStatus
        status="no"
        msg={
          <>
            <div>
              This plan <b>does not</b> meet the objective of protecting{" "}
              <b>{percentWithEdge(objective)}</b> of key nursery habitat.
            </div>
            {progressMsg}
          </>
        }
      />
    );
  }

  return <div style={{ paddingBottom: 20 }}>{objectiveCmp}</div>;
};

const genHelp = () => (
  <>
    <Collapse title="Learn More">
      <p>
        Objective: Identify and protect 50% of coastal habitats that appear to
        be juvenile fish nursery habitats and/or used by protected marine
        species.
      </p>
      <p>
        To achieve the objective, increase enough MPAs in the plan to{" "}
        <b>full</b> protection. Or discuss appropriate implementation measures
        that will ensure the objective can still be met under a <b>high</b>{" "}
        protection level.
      </p>
      <p>
        Strategy: The effectiveness of a plan increases when its MPAs contain a
        mosaic of habitats (two or more types). Strive to include multiple
        habitat types in MPA boundaries.
      </p>
      <p></p>
    </Collapse>
  </>
);

const LoadingSkeleton = () => (
  <p>
    <Skeleton style={{}}>&nbsp;</Skeleton>
  </p>
);

export default KeyNurseryHabitat;
