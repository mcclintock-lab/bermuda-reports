import React from "react";
import {
  GroupMetricAgg,
  GroupMetricSketchAgg,
  NullSketch,
  percentWithEdge,
  keyBy,
  capitalize,
  percentGoalWithEdge,
  UserAttribute,
  toNullSketchArray,
  isSketchCollection,
  toPercentMetric,
  flattenByGroupSketchAllClass,
  flattenByGroupAllClass,
} from "@seasketch/geoprocessing/client-core";
import {
  ResultsCard,
  Skeleton,
  Table,
  Column,
  ReportError,
  useSketchProperties,
} from "@seasketch/geoprocessing/client-ui";
// Import the results type definition from your functions to type-check your
// component render functions
import config, { ReportResult, ReportResultBase } from "../_config";
import { getCategoryForActivities } from "../util/iucnProtectionLevel";
import { ObjectiveStatus } from "../components/ObjectiveStatus";
import { Collapse } from "../components/Collapse";
import { Pill, LevelPill } from "../components/Pill";
import { LayerToggle } from "@seasketch/geoprocessing/client-ui";
import { LevelCircleRow } from "../components/Circle";
import { SmallReportTableStyled } from "../components/SmallReportTableStyled";
import { ClassTable } from "../components/ClassTable";

import habitatNurseryTotals from "../../data/precalc/habitatNurseryTotals.json";
const precalcTotals = habitatNurseryTotals as ReportResultBase;

const REPORT = config.habitatNursery;
const METRIC = REPORT.metrics.areaOverlap;

const KeyNurseryHabitat = () => {
  const [{ isCollection, userAttributes }] = useSketchProperties();

  return (
    <>
      <ResultsCard
        title="Key Nursery Habitat"
        functionName="habitatNursery"
        skeleton={<LoadingSkeleton />}
      >
        {(data: ReportResult) => {
          return (
            <ReportError>
              {isCollection
                ? genNetwork(data)
                : genSingle(data, userAttributes)}
            </ReportError>
          );
        }}
      </ResultsCard>
    </>
  );
};

const genSingle = (data: ReportResult, userAttributes: UserAttribute[]) => {
  // Lookup group ID
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
  const groupId = getCategoryForActivities(activities).level;

  // Class metrics
  const classPercMetrics = toPercentMetric(
    data.metrics.filter(
      (m) => m.classId && !m.groupId && m.sketchId === data.sketch.properties.id
    ),
    precalcTotals.metrics
  );

  // Class aggregate by group - only one group can have value > 0 per sketch
  const groupMetrics = data.metrics.filter(
    (m) => !!m.groupId && m.sketchId === data.sketch.properties.id
  );
  const groupAggs = flattenByGroupSketchAllClass(
    toNullSketchArray(data.sketch),
    groupMetrics,
    precalcTotals.metrics
  );
  const groupAgg = groupAggs.find((agg) => agg.value > 0);
  const groupValue = groupAgg ? groupAgg.percValue : 0;

  return (
    <>
      {genSingleObjective(
        groupId,
        groupValue,
        config.objectives.habitatNursery
      )}
      <ClassTable
        titleText="Type"
        rows={Object.values(classPercMetrics)}
        classes={METRIC.classes}
      />
      {genHelp()}
    </>
  );
};

const genNetwork = (data: ReportResult) => {
  const sketches = toNullSketchArray(data.sketch);
  const sketchesById = keyBy(sketches, (sk) => sk.properties.id);

  let groupAggs: GroupMetricAgg[] = [];
  let sketchAggs: GroupMetricSketchAgg[] = [];
  if (isSketchCollection(data.sketch)) {
    const groupMetrics = data.metrics.filter((m) => m.groupId);

    // Build agg group objects with percValue for each class
    groupAggs = flattenByGroupAllClass(
      data.sketch,
      groupMetrics,
      precalcTotals.metrics
    );

    // Build agg sketch group objects with percValue for each class
    // groupId, sketchId, class1, class2, ..., total
    sketchAggs = flattenByGroupSketchAllClass(
      sketches,
      groupMetrics,
      precalcTotals.metrics
    );
  }

  return (
    <>
      {genNetworkObjective(groupAggs, config.objectives.habitatNursery)}
      {genGroupTable(groupAggs)}
      <Collapse title="Show by MPA">
        {genSketchTable(sketchesById, sketchAggs)}
      </Collapse>
      {genHelp()}
      {genHabitatToggles()}
    </>
  );
};

const genHabitatToggles = () => {
  return (
    <>
      {METRIC.classes.map((curClass) => (
        <LayerToggle
          key={curClass.layerId}
          label={`Show ${curClass.display} Layer`}
          layerId={curClass.layerId}
        />
      ))}
    </>
  );
};

const genSketchTable = (
  sketchesById: Record<string, NullSketch>,
  sketchRows: GroupMetricSketchAgg[]
) => {
  const classColumns: Column<GroupMetricSketchAgg>[] = METRIC.classes.map(
    (curClass) => ({
      Header: curClass.display,
      accessor: (row) => percentWithEdge(row[curClass.classId] as number),
    })
  );

  const columns: Column<GroupMetricSketchAgg>[] = [
    {
      Header: "MPA",
      accessor: (row) => (
        <LevelCircleRow
          level={row.groupId}
          rowText={sketchesById[row.sketchId].properties.name}
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
        data={sketchRows.sort((a, b) => a.groupId.localeCompare(b.groupId))}
      />
    </SmallReportTableStyled>
  );
};

const genGroupTable = (groupRows: GroupMetricAgg[]) => {
  const classColumns: Column<GroupMetricAgg>[] = METRIC.classes.map(
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

/**
 * Single objective status component
 */
const genSingleObjective = (
  groupId: string,
  actual: number,
  objective: number
) => {
  let objectiveCmp;
  switch (groupId) {
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
  aggMetrics: GroupMetricAgg[],
  objective: number
) => {
  const aggMetricsByGroup = keyBy(aggMetrics, (am) => am.groupId);
  const fullPerc = aggMetricsByGroup["full"].percValue;
  const highPerc = aggMetricsByGroup["high"].percValue;
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
  <div>
    <Skeleton style={{}}>&nbsp;</Skeleton>
  </div>
);

export default KeyNurseryHabitat;
