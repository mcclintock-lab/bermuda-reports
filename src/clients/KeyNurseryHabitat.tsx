import React from "react";
import {
  ResultsCard,
  Skeleton,
  ReportError,
  useSketchProperties,
  percentLower,
  UserAttribute,
  Table,
  Column,
  keyBy,
  capitalize,
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
} from "../util/types";
import {
  IucnCategory,
  getCategoryForActivities,
} from "../util/iucnProtectionLevel";
import { ObjectiveStatus } from "../components/ObjectiveStatus";
import { Collapse } from "../components/Collapse";
import { Pill, LevelPill } from "../components/Pill";
import { ClassMetric } from "../util/types";
import { LayerToggle } from "@seasketch/geoprocessing/client";
import { LevelCircleRow } from "../components/Circle";

import styled from "styled-components";
import { getGroupMetricsAgg, getGroupMetricsSketchAgg } from "../util/metrics";

import habitatNurseryTotals from "../../data/precalc/habitatNurseryTotals.json";
const precalcTotals = habitatNurseryTotals as HabitatNurseryResults;

const Number = new Intl.NumberFormat("en", { style: "decimal" });
const Percent = new Intl.NumberFormat("en", {
  style: "percent",
  maximumFractionDigits: 1,
});
const PercentZero = new Intl.NumberFormat("en", {
  style: "percent",
  maximumFractionDigits: 0,
});

const TableStyled = styled.div`
  .styled {
    td {
      padding: 5px 5px;
    }
  }
}
`;

const SmallTableStyled = styled.div`
  .squeeze {
    font-size: 13px;

    td,
    th {
      padding: 5px 5px;
    }

    td:last-child,
    th:last-child {
      text-align: right;
    }
  }
`;

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
        getGroupMetricsSketchAgg(
          data.byLevel,
          precalcTotals.overall.value,
          config.habitatNursery.layers
        )[0].percValue
      )}
      {genHabitatTable(Object.values(data.byClass))}
      {genHelp()}
    </>
  );
};

const genNetwork = (data: HabitatNurseryLevelResults) => {
  // Build agg group objects with percValue for each class
  const levelRows: GroupMetricAgg[] = getGroupMetricsAgg(
    data.byLevel,
    precalcTotals.overall.value
  );

  // Build agg sketch group objects with percValue for each class
  // groupId, sketchId, lagoon, mangrove, seagrass, total
  const sketchRows = getGroupMetricsSketchAgg(
    data.byLevel,
    precalcTotals.overall.value,
    config.habitatNursery.layers
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
      {config.habitatNursery.layers.map((lyr) => (
        <LayerToggle
          label={`Show ${lyr.display} Layer`}
          layerId={lyr.layerId}
        />
      ))}
    </>
  );
};

const genSketchTable = (sketchRows: GroupMetricSketchAgg[]) => {
  const classColumns: Column<GroupMetricSketchAgg>[] = config.habitatNursery.layers.map(
    (lyr) => ({
      Header: lyr.display,
      accessor: (row) =>
        row[lyr.baseFilename] === 0
          ? Percent.format(row[lyr.baseFilename] as number)
          : percentLower(row[lyr.baseFilename] as number),
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
            {row.percValue === 0
              ? Percent.format(row.percValue)
              : percentLower(row.percValue as number)}
          </LevelPill>
        );
      },
    },
  ];

  return (
    <SmallTableStyled>
      <Table
        className="squeeze"
        columns={columns}
        data={sketchRows.sort((a, b) => a.groupId.localeCompare(b.groupId))}
      />
    </SmallTableStyled>
  );
};

const genGroupTable = (groupRows: GroupMetricAgg[]) => {
  const classColumns: Column<GroupMetricAgg>[] = config.habitatNursery.layers.map(
    (lyr) => ({
      Header: lyr.display,
      accessor: (row) =>
        row[lyr.baseFilename] === 0
          ? Percent.format(row[lyr.baseFilename] as number)
          : percentLower(row[lyr.baseFilename] as number, {
              lower: 0.001,
              digits: 1,
            }),
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
            {row.percValue === 0
              ? Percent.format(row.percValue)
              : percentLower(row.percValue as number, {
                  lower: 0.001,
                  digits: 1,
                })}
          </LevelPill>
        );
      },
    },
  ];

  return (
    <SmallTableStyled>
      <Table
        className="squeeze"
        columns={columns}
        data={groupRows.sort((a, b) => a.groupId.localeCompare(b.groupId))}
      />
    </SmallTableStyled>
  );
};

const genHabitatTable = (data: ClassMetric[]) => {
  const layers = config.habitatNursery.layers;
  const classConfig = keyBy(layers, (lyr) => lyr.baseFilename);

  const columns: Column<ClassMetric>[] = [
    {
      Header: "Habitat Type",
      accessor: (row) => classConfig[row.name].display,
      style: { width: "30%" },
    },
    {
      Header: "% Within Plan",
      style: { textAlign: "right", width: "30%" },
      accessor: (row, index) => percentLower(row.percValue),
    },
    {
      Header: "Show Map",
      accessor: (row) => (
        <LayerToggle
          simple
          layerId={classConfig[row.name].layerId}
          style={{ marginTop: 0, marginLeft: 15 }}
        />
      ),
      style: { width: "20%" },
    },
  ];

  return (
    <TableStyled>
      <Table className="styled" columns={columns} data={data} />
    </TableStyled>
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
              <b>{percentLower(actual, { digits: 0, lower: 0.001 })}</b> of
              known key nursery habitat and counts toward protecting{" "}
              <b>{percentLower(objective, { digits: 0, lower: 0.001 })}</b>{" "}
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
              <b>{percentLower(actual, { digits: 0, lower: 0.001 })}</b> of
              known key nursery habitat and <b>may</b> count towards protecting{" "}
              <b>{percentLower(objective, { digits: 0, lower: 0.001 })}</b>{" "}
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
              <b>{percentLower(actual, { digits: 0, lower: 0.001 })}</b> of
              known key nursery habitat and <b>does not</b> count towards
              protecting{" "}
              <b>{percentLower(objective, { digits: 0, lower: 0.001 })}</b>{" "}
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
  const lower = percentLower(fullPerc);

  const fullPercDisplay =
    fullPerc === 0 ? Percent.format(fullPerc) : percentLower(fullPerc);

  const highPercDisplay =
    highPerc === 0 ? Percent.format(highPerc) : percentLower(highPerc);

  const combinedPercDisplay =
    fullPerc + highPerc === 0
      ? Percent.format(fullPerc + highPerc)
      : percentLower(fullPerc + highPerc);

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
            <Pill>{percentLower(needed, { lower: 0.1, digits: 1 })}</Pill>
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
            <b>{PercentZero.format(objective)}</b> of key nursery habitat.
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
              <b>{PercentZero.format(objective)}</b> of key nursery habitat.
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
              <b>{PercentZero.format(objective)}</b> of key nursery habitat.
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
