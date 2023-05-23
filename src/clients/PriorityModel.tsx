import React from "react";
import {
  GroupMetricAgg,
  GroupMetricSketchAgg,
  NullSketch,
  ReportResult,
  ReportResultBase,
  percentWithEdge,
  getIucnCategoryForActivities,
  keyBy,
  capitalize,
  percentGoalWithEdge,
  UserAttribute,
  toNullSketchArray,
  firstMatchingMetric,
  isSketchCollection,
  toPercentMetric,
  flattenByGroupSketchAllClass,
  flattenByGroupAllClass,
} from "@seasketch/geoprocessing/client-core";
import {
  Column,
  Collapse,
  LayerToggle,
  IucnLevelCircleRow,
  IucnLevelPill,
  ObjectiveStatus,
  Pill,
  ReportError,
  ResultsCard,
  Skeleton,
  SmallReportTableStyled,
  Table,
  useSketchProperties,
} from "@seasketch/geoprocessing/client-ui";
import { ClassTable } from "../components/ClassTable";

import config from "../_config";

import priorityModelTotals from "../../data/precalc/priorityModelTotals.json";
import {
  GroupMetricAggNoTotal,
  GroupMetricSketchAggNoTotal,
  flattenByGroupAllClassNoTotal,
  flattenByGroupSketchAllClassNoTotal,
} from "../util/helpers";
const precalcTotals = priorityModelTotals as ReportResultBase;

const REPORT = config.priorityModel;
const METRIC = REPORT.metrics.priorityModelAreaOverlap;

const PriorityModel = () => {
  const [{ isCollection, userAttributes }] = useSketchProperties();

  return (
    <>
      <ResultsCard title="Priority Areas" functionName="priorityModel">
        {(data: ReportResult) => {
          return (
            <ReportError>
              <p>
                Areas have been pre-identified using a prioritization modeling
                approach that meets multiple objectives of this planning
                process. Consider including these areas in order to achieve
                planning goals. This report summarizes the percentage of the
                areas that overlap with this plan.
              </p>
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
  const groupId = getIucnCategoryForActivities(activities).level;

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
  const groupAggs = flattenByGroupSketchAllClassNoTotal(
    toNullSketchArray(data.sketch),
    groupMetrics,
    precalcTotals.metrics
  );
  const groupAgg = groupAggs.find((agg) => agg.value > 0);
  const groupValue = groupAgg ? groupAgg.percValue : 0;

  return (
    <>
      <ClassTable
        titleText=" "
        rows={Object.values(classPercMetrics)}
        dataGroup={METRIC}
        showLayerToggle
        formatPerc
      />
      {genHelp()}
    </>
  );
};

const genNetwork = (data: ReportResult) => {
  const totalPriorityPerc = toPercentMetric(
    [
      firstMatchingMetric(
        data.metrics,
        (m) => m.sketchId === data.sketch.properties.id && m.groupId === null
      ),
    ],
    precalcTotals.metrics
  )[0];

  const sketches = toNullSketchArray(data.sketch);
  const sketchesById = keyBy(sketches, (sk) => sk.properties.id);

  let groupAggs: GroupMetricAggNoTotal[] = [];
  let sketchAggs: GroupMetricSketchAggNoTotal[] = [];
  if (isSketchCollection(data.sketch)) {
    const groupMetrics = data.metrics.filter((m) => m.groupId);

    // Build agg group objects with percValue for each class
    groupAggs = flattenByGroupAllClassNoTotal(
      data.sketch,
      groupMetrics,
      precalcTotals.metrics
    );

    // Build agg sketch group objects with percValue for each class
    // groupId, sketchId, class1, class2, ..., total
    sketchAggs = flattenByGroupSketchAllClassNoTotal(
      sketches,
      groupMetrics,
      precalcTotals.metrics
    );
  }

  return (
    <>
      <p>
        <b>
          This plan contains{" "}
          <Pill>{percentWithEdge(totalPriorityPerc.value)}</Pill> of priority
          areas.
        </b>
      </p>
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
          label={`Show Priority Areas`}
          layerId={curClass.layerId}
        />
      ))}
    </>
  );
};

const genSketchTable = (
  sketchesById: Record<string, NullSketch>,
  sketchRows: GroupMetricSketchAggNoTotal[]
) => {
  const classColumns: Column<GroupMetricSketchAggNoTotal>[] =
    METRIC.classes.map((curClass) => ({
      Header: "Within Plan",
      accessor: (row) => percentWithEdge(row[curClass.classId] as number),
    }));

  const columns: Column<GroupMetricSketchAggNoTotal>[] = [
    {
      Header: "MPA",
      accessor: (row) => (
        <IucnLevelCircleRow
          level={row.groupId}
          rowText={sketchesById[row.sketchId].properties.name}
          circleText={capitalize(row.groupId[0])}
        />
      ),
    },
    ...classColumns,
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

const genGroupTable = (groupRows: GroupMetricAggNoTotal[]) => {
  const classColumns: Column<GroupMetricAggNoTotal>[] = METRIC.classes.map(
    (curClass) => ({
      Header: "Within Plan",
      accessor: (row) => percentWithEdge(row[curClass.classId] as number),
      style: { width: "10%" },
    })
  );

  const columns: Column<GroupMetricAggNoTotal>[] = [
    {
      Header: "By Protection Level:",
      accessor: (row) => (
        <IucnLevelCircleRow
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

const genHelp = () => (
  <>
    <Collapse title="Learn More">
      <p>
        ℹ️ Overview: A prioritization model was used to find optimal areas to
        meet planning objectives. The model was designed to meet the following
        targets:
        <ul>
          <li>Habitat zones: 20% of each habitat zones</li>
          <li>
            Coral/ benthic data: 30% of the total value of each of the coral/
            benthic data layers
          </li>
          <li>Fish: 30% of the total value of each of the fish data layers</li>
          <li>Seagrass: 50% of the total seagrass index value</li>
          <li>Mangroves: 50% of mangrove area</li>
          <li>Nursery reef: 50% of the nursery reef area</li>
        </ul>{" "}
      </p>
      <p>
        🎯 Planning Objective: there is no specific objective for including
        these priority areas in your plan, but they can be used to guide
        discussion.{" "}
      </p>
      <p>
        📈 Report: Percentages are calculated by summing the portion of priority
        areas found within the plans MPAs, and dividing it by the sum of all
        priority areas. If the plan includes multiple MPAs that overlap, the
        overlap is only counted once.
      </p>
    </Collapse>
  </>
);

export default React.memo(PriorityModel);
