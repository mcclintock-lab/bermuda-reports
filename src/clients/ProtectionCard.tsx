import React from "react";
import {
  ResultsCard,
  Table,
  Column,
  capitalize,
  keyBy,
  percentWithEdge,
  percentGoalWithEdge,
  ReportError,
  useSketchProperties,
} from "@seasketch/geoprocessing/client";
import styled from "styled-components";
import { ObjectiveStatus } from "../components/ObjectiveStatus";
import { Pill, LevelPill } from "../components/Pill";
import { LevelCircleRow } from "../components/Circle";
import { IucnMatrix } from "../components/IucnMatrix";

// Import type definitions from function
import {
  ProtectionResult,
  SketchStat,
  CategoryStat,
  LevelStat,
} from "../functions/protection";
import { iucnCategories, IucnCategory } from "../util/iucnProtectionLevel";
import { Collapse } from "../components/Collapse";
import config from "../_config";
import { IucnDesignationTable } from "../components/IucnDesignationTable";

const EEZ_OBJECTIVE = config.objectives.eez;

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

const ProtectionCard = () => {
  const [{ isCollection, ...rest }] = useSketchProperties();
  return (
    <ResultsCard title="Protection Level" functionName="protection">
      {(data: ProtectionResult) => {
        if (data.sketchStats.length === 0)
          throw new Error("Protection results not found");
        return (
          <ReportError>
            {isCollection
              ? networkProtection(data)
              : singleProtection(data.sketchStats[0])}
          </ReportError>
        );
      }}
    </ResultsCard>
  );
};

const singleProtection = (sketchCategory: SketchStat) => {
  const category: IucnCategory = iucnCategories[sketchCategory.category];

  return (
    <>
      {genSingleObjective(category, EEZ_OBJECTIVE)}
      {genSingleSketchTable([category])}
      {genLearnMore()}
    </>
  );
};

const networkProtection = (data: ProtectionResult) => {
  const levelMap = keyBy(data.levelStats, (item) => item.level);
  return (
    <>
      {genNetworkObjective(levelMap, EEZ_OBJECTIVE)}
      {genLevelTable(data.levelStats)}
      <Collapse title="Show by MPA">
        {genSketchTable(data.sketchStats)}
      </Collapse>
      <Collapse title="Show By Category">
        {genCategoryTable(data.categoryStats)}
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
  levelMap: Record<string, LevelStat>,
  objective: number
) => {
  const fullPerc = levelMap["full"]?.percPlanningArea || 0;
  const highPerc = levelMap["high"]?.percPlanningArea || 0;
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

const genLevelTable = (levelStats: LevelStat[]) => {
  const columns: Column<LevelStat>[] = [
    {
      Header: "Based on allowed activities, this plan contains:",
      accessor: (row) => (
        <LevelCircleRow
          level={row.level}
          circleText={`${row.numSketches}`}
          rowText={
            <>
              <b>{capitalize(row.level)}</b> Protection MPA
              {row.numSketches === 1 ? "" : "s"}
            </>
          }
        />
      ),
    },
    {
      Header: "% EEZ",
      accessor: (row) => (
        <LevelPill level={row.level}>
          {percentGoalWithEdge(row.percPlanningArea, EEZ_OBJECTIVE)}
        </LevelPill>
      ),
      style: { width: "15%" },
    },
  ];

  return (
    <SmallTableStyled>
      <Table
        className="squeeze"
        columns={columns}
        data={levelStats.sort((a, b) => a.level.localeCompare(b.level))}
      />
    </SmallTableStyled>
  );
};

const genCategoryRowText = (row: CategoryStat | SketchStat) => {
  let rowText: string = "";
  const cats = iucnCategories[row.category].categories;
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
        <span>{row.category !== "None" && <Pill>{row.category}</Pill>}</span>{" "}
        <span>{iucnCategories[row.category].name}</span>
      </>
    );
  }
};

const genCategoryTable = (categoryStats: CategoryStat[]) => {
  const columns: Column<CategoryStat>[] = [
    {
      Header: "  ",
      accessor: (row) => (
        <LevelCircleRow level={row.level} circleText={row.numSketches} />
      ),
    },
    {
      Header: "Category",
      accessor: (row) => genCategoryRowText(row),
    },
    {
      Header: "%EEZ",
      accessor: (row) =>
        percentGoalWithEdge(row.percPlanningArea, EEZ_OBJECTIVE),
      style: { width: "15%" },
    },
  ];

  return (
    <SmallTableStyled>
      <Table
        className="squeeze"
        columns={columns}
        data={categoryStats.sort((a, b) => a.level.localeCompare(b.level))}
      />
    </SmallTableStyled>
  );
};

const genSketchTable = (sketchStats: SketchStat[]) => {
  const columns: Column<SketchStat>[] = [
    {
      Header: "MPA",
      accessor: (row) => (
        <LevelCircleRow level={row.level} rowText={row.name} />
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
          {percentGoalWithEdge(row.percPlanningArea, EEZ_OBJECTIVE)}
        </span>
      ),
      style: { width: "15%" },
    },
  ];

  return (
    <SmallTableStyled>
      <Table
        className="squeeze"
        columns={columns}
        data={sketchStats.sort((a, b) => a.category.localeCompare(b.category))}
      />
    </SmallTableStyled>
  );
};

export default ProtectionCard;
