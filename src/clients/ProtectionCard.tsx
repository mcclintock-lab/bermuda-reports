import React from "react";
import {
  capitalize,
  keyBy,
  percentWithEdge,
  percentGoalWithEdge,
  toNullSketchArray,
  isSketchCollection,
  NullSketch,
} from "@seasketch/geoprocessing/client-core";
import {
  ResultsCard,
  Table,
  Column,
  ReportError,
  useSketchProperties,
} from "@seasketch/geoprocessing/client-ui";
import { ObjectiveStatus } from "../components/ObjectiveStatus";
import { Pill, LevelPill } from "../components/Pill";
import { LevelCircleRow } from "../components/Circle";
import { IucnMatrix } from "../components/IucnMatrix";
import { Collapse } from "../components/Collapse";
import { IucnDesignationTable } from "../components/IucnDesignationTable";
import { SmallReportTableStyled } from "../components/SmallReportTableStyled";

// Import type definitions from function
import config, { ReportResult, ReportResultBase } from "../_config";
import { iucnCategories, IucnCategory } from "../util/iucnProtectionLevel";
import { categories, levels } from "../util/iucnProtectionLevel";
import {
  firstMatchingMetric,
  flattenByGroup,
  flattenByGroupSketch,
} from "../metrics/clientMetrics";
import { GroupMetricAgg, GroupMetricSketchAgg } from "../metrics/types";

import protectionTotals from "../../data/precalc/protectionTotals.json";
const precalcTotals = protectionTotals as ReportResultBase;

const EEZ_OBJECTIVE = config.objectives.eez;

const ProtectionCard = () => {
  const [{ isCollection }] = useSketchProperties();
  return (
    <ResultsCard title="Protection Level" functionName="protection">
      {(data: ReportResult) => {
        if (data.metrics.length === 0)
          throw new Error("Protection results not found");
        return (
          <ReportError>
            {isCollection ? networkProtection(data) : singleProtection(data)}
          </ReportError>
        );
      }}
    </ResultsCard>
  );
};

const singleProtection = (data: ReportResult) => {
  // Get the category for single sketch
  const categoryMetric = firstMatchingMetric(
    data.metrics,
    (m) =>
      !!m.groupId &&
      categories.includes(m.groupId) &&
      m.sketchId === data.sketch.properties.id
  );
  const category: IucnCategory =
    iucnCategories[categoryMetric.groupId as string];

  return (
    <>
      {genSingleObjective(category, EEZ_OBJECTIVE)}
      {genSingleSketchTable([category])}
      {genLearnMore()}
    </>
  );
};

const networkProtection = (data: ReportResult) => {
  const sketches = toNullSketchArray(data.sketch);
  const sketchesById = keyBy(sketches, (sk) => sk.properties.id);

  let groupCategoryAggs: GroupMetricAgg[] = [];
  let sketchCategoryAggs: GroupMetricSketchAgg[] = [];
  let groupLevelAggs: GroupMetricAgg[] = [];
  let sketchLevelAggs: GroupMetricSketchAgg[] = [];
  if (isSketchCollection(data.sketch)) {
    const categoryMetrics = data.metrics.filter(
      (m) => m.groupId && categories.includes(m.groupId)
    );
    groupCategoryAggs = flattenByGroup(
      data.sketch,
      categoryMetrics,
      precalcTotals.metrics
    );
    sketchCategoryAggs = flattenByGroupSketch(
      sketches,
      categoryMetrics,
      precalcTotals.metrics
    );

    const levelMetrics = data.metrics.filter(
      (m) => m.groupId && levels.includes(m.groupId)
    );
    groupLevelAggs = flattenByGroup(
      data.sketch,
      levelMetrics,
      precalcTotals.metrics
    );
    sketchLevelAggs = flattenByGroupSketch(
      sketches,
      levelMetrics,
      precalcTotals.metrics
    );
  }

  return (
    <>
      {genNetworkObjective(groupLevelAggs, EEZ_OBJECTIVE)}
      {genGroupLevelTable(groupLevelAggs)}
      <Collapse title="Show by MPA">
        {genSketchTable(sketchesById, sketchLevelAggs, sketchCategoryAggs)}
      </Collapse>
      <Collapse title="Show By Category">
        {genGroupCategoryTable(groupCategoryAggs, groupLevelAggs)}
      </Collapse>
      {genLearnMore()}
    </>
  );
};

const genSingleObjective = (category: IucnCategory, objective: number) => {
  switch (category.level) {
    case "full":
      return (
        <ObjectiveStatus
          status="yes"
          msg={
            <>
              This MPA <b>is</b> suitable for inclusion in the{" "}
              <b>{percentWithEdge(objective)}</b> fully protected fisheries
              replenishment zones.
            </>
          }
        />
      );
    case "high":
      return (
        <ObjectiveStatus
          status="maybe"
          msg={
            <>
              This MPA <b>may be</b> suitable for inclusion in the{" "}
              <b>{percentWithEdge(objective)}</b> fully protected fisheries
              replenishment zones.
            </>
          }
        />
      );
    default:
      return (
        <ObjectiveStatus
          status="no"
          msg={
            <>
              This MPA <b>is not</b> suitable for inclusion in the{" "}
              <b>{percentWithEdge(objective)}</b> fully protected fisheries
              replenishment zones.
            </>
          }
        />
      );
  }
};

const genNetworkObjective = (
  aggMetrics: GroupMetricAgg[],
  objective: number
) => {
  const aggMetricsByGroup = keyBy(aggMetrics, (am) => am.groupId);
  const fullPerc = aggMetricsByGroup["full"].percValue;
  const highPerc = aggMetricsByGroup["high"].percValue;
  const needed = EEZ_OBJECTIVE - fullPerc - highPerc;

  const fullPercDisplay = percentGoalWithEdge(fullPerc, EEZ_OBJECTIVE);
  const highPercDisplay = percentGoalWithEdge(highPerc, EEZ_OBJECTIVE);

  const combinedPercDisplay = percentGoalWithEdge(
    fullPerc + highPerc,
    EEZ_OBJECTIVE
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
            <Pill>{percentGoalWithEdge(needed, EEZ_OBJECTIVE)}</Pill>
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
            This plan meets the objective of designating{" "}
            <b>{percentWithEdge(objective)}</b> of the Bermuda EEZ as fully
            protected fisheries replenishment zones.
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
              This plan <b>may</b> meet the objective of designating{" "}
              <b>{percentWithEdge(objective)}</b> of the Bermuda EEZ as fully
              protected fisheries replenishment zones.
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
              This plan <b>does not</b> meet the objective of designating{" "}
              <b>{percentWithEdge(objective)}</b> of the Bermuda EEZ as fully
              protected fisheries replenishment zones.
            </div>
            {progressMsg}
          </>
        }
      />
    );
  }

  return <div style={{ paddingBottom: 20 }}>{objectiveCmp}</div>;
};

const genLearnMore = () => {
  return (
    <Collapse title="Learn more">
      <p>
        This report looks at an MPAs allowed activities and assigns the first
        category (1a-6) that allows all of those actitivities.
      </p>

      <p>
        The MPA categories are{" "}
        <a
          href="https://www.iucn.org/theme/protected-areas/about/protected-area-categories"
          target="_blank"
        >
          defined by the IUCN
        </a>{" "}
        and recognised by international bodies such as the United Nations and by
        many national governments as the global standard for defining and
        recording protected areas.
      </p>

      <IucnDesignationTable />

      <p>
        <b>Category 1-3</b> offer{" "}
        <b>
          <i>full</i>
        </b>{" "}
        protection and are suitable for inclusion in 20% fully protected
        fisheries replenishment zone. <b>Category 4-6</b> offer
        <b>
          <i>high</i>
        </b>{" "}
        protection and may be suitable for inclusion, but only if there are
        appropriate implementation measures to ensure objectives can still be
        met. Those that do not receive a category are not suitable and offer{" "}
        <b>
          <i>low</i>
        </b>{" "}
        protection.
      </p>

      <p>
        If MPA boundaries overlap with each other, the overlap is only counted
        once towards meeting objectives. If the overlapping MPAs have different
        category or protection levels, the higher category/level applies and the
        overlap is counted under it.
      </p>

      <p>
        To increase the category of an MPA from a lower level, edit and remove
        any activities that are not allowed by the target level (see table
        below)
      </p>

      <p>
        The full list of activities and whether they are allowed under each
        category are as follows.
      </p>
      <IucnMatrix />

      <p>
        More information can be found in the{" "}
        <a
          href="https://portals.iucn.org/library/sites/library/files/documents/PAG-019-2nd%20ed.-En.pdf"
          target="_blank"
        >
          Guidelines for applying the IUCN protected area management categories
          to marine protected areas
        </a>
      </p>
    </Collapse>
  );
};

const genSingleSketchTable = (categories: IucnCategory[]) => {
  const columns: Column<IucnCategory>[] = [
    {
      Header: "Protection",
      accessor: (row) => capitalize(row.level),
    },
    {
      Header: "Category",
      accessor: (row) => `(${row.category ? row.category : "-"}) ${row.name}`,
    },
  ];
  return <Table columns={columns} data={categories} />;
};

const genGroupLevelTable = (levelAggs: GroupMetricAgg[]) => {
  const columns: Column<GroupMetricAgg>[] = [
    {
      Header: "Based on allowed activities, this plan contains:",
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
    {
      Header: "% EEZ",
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
        data={levelAggs.sort((a, b) => a.groupId.localeCompare(b.groupId))}
      />
    </SmallReportTableStyled>
  );
};

const genGroupCategoryTable = (
  categoryAggs: GroupMetricAgg[],
  levelAggs: GroupMetricAgg[]
) => {
  const columns: Column<GroupMetricAgg>[] = [
    {
      Header: "  ",
      accessor: (row, index) => (
        <LevelCircleRow
          level={levelAggs[index].groupId}
          circleText={row.numSketches}
        />
      ),
    },
    {
      Header: "Category",
      accessor: (row) => genCategoryRowText(row),
    },
    {
      Header: "%EEZ",
      accessor: (row) => percentGoalWithEdge(row.percValue, EEZ_OBJECTIVE),
      style: { width: "15%" },
    },
  ];

  return (
    <SmallReportTableStyled>
      <Table
        className="styled"
        columns={columns}
        data={categoryAggs.sort((a, b) => a.groupId.localeCompare(b.groupId))}
      />
    </SmallReportTableStyled>
  );
};

const genCategoryRowText = (categoryAgg: GroupMetricAgg) => {
  let rowText: string = "";
  const cats = iucnCategories[categoryAgg.groupId].categories;
  if (cats) {
    return cats
      .map((cat) => {
        return (
          <>
            <span>
              {cat.category !== "None" && <Pill>{cat.category}</Pill>}
            </span>{" "}
            <span>{cat.name}</span>
          </>
        );
      })
      .reduce<JSX.Element[]>(
        (acc, catEl, index) => [
          ...acc,
          catEl,
          index === cats.length - 1 ? <></> : <span> or </span>,
        ],
        []
      );
  } else {
    return (
      <>
        <span>
          {categoryAgg.groupId !== "None" && <Pill>{categoryAgg.groupId}</Pill>}
        </span>{" "}
        <span>{iucnCategories[categoryAgg.groupId].name}</span>
      </>
    );
  }
};

const genSketchTable = (
  sketchesById: Record<string, NullSketch>,
  sketchLevelAggs: GroupMetricSketchAgg[],
  sketchCategoryAggs: GroupMetricSketchAgg[]
) => {
  const columns: Column<GroupMetricSketchAgg>[] = [
    {
      Header: "MPA",
      accessor: (row, index) => (
        <LevelCircleRow
          level={sketchLevelAggs[index].groupId}
          rowText={sketchesById[row.sketchId].properties.name}
        />
      ),
    },
    {
      Header: "Category",
      accessor: (row) => genCategoryRowText(row),
    },
    {
      Header: "% EEZ",
      accessor: (row) => (
        <span className="eezPerc">
          {percentGoalWithEdge(row.percValue as number, EEZ_OBJECTIVE)}
        </span>
      ),
      style: { width: "15%" },
    },
  ];

  return (
    <SmallReportTableStyled>
      <Table
        className="styled"
        columns={columns}
        data={sketchCategoryAggs.sort((a, b) =>
          a.groupId.localeCompare(b.groupId)
        )}
      />
    </SmallReportTableStyled>
  );
};

export default ProtectionCard;
