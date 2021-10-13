import React from "react";
import {
  ResultsCard,
  KeySection,
  Table,
  Column,
  capitalize,
  keyBy,
} from "@seasketch/geoprocessing/client";
import styled from "styled-components";
import { ObjectiveStatus } from "../components/ObjectiveStatus";
import { PillColumn, Pill, LevelPill } from "../components/Pill";
import { Circle, LevelCircle, LevelCircleRow } from "../components/Circle";

// Import type definitions from function
import {
  ProtectionResult,
  SketchStat,
  CategoryStat,
  LevelStat,
} from "../functions/protection";
import { iucnCategories, IucnCategory } from "../util/iucnProtectionLevel";
import { Collapse } from "../components/Collapse";

const Number = new Intl.NumberFormat("en", { style: "decimal" });
const Percent = new Intl.NumberFormat("en", {
  style: "percent",
  maximumFractionDigits: 2,
});
const PercentZero = new Intl.NumberFormat("en", {
  style: "percent",
  maximumFractionDigits: 0,
});

const SmallTableStyled = styled.div`
  .squeeze {
    font-size: 14px;

    td {
      padding: 5px 5px;
    }
  }
`;

const GOAL = 0.2;

const ProtectionCard = () => (
  <ResultsCard title="Protection Level" functionName="protection">
    {(data: ProtectionResult) => {
      if (data.sketchStats.length === 0)
        throw new Error("Protection results not found");
      return data.sketchStats.length > 1
        ? networkProtection(data)
        : singleProtection(data.sketchStats[0]);
    }}
  </ResultsCard>
);

const singleProtection = (sketchCategory: SketchStat) => {
  const category: IucnCategory = iucnCategories[sketchCategory.category];

  return (
    <>
      {genSingleObjective(category, 0.2)}
      {genLearnMore()}
      {genSingleSketchTable([category])}
    </>
  );
};

const networkProtection = (data: ProtectionResult) => {
  const levelMap = keyBy(data.levelStats, (item) => item.level);
  return (
    <>
      {genNetworkObjective(levelMap, 0.2)}
      {genLearnMore()}
      {genLevelTable(data.levelStats)}
      {genSketchTable(data.sketchStats)}
      <Collapse title="Show By Category">
        {genCategoryTable(data.categoryStats)}
      </Collapse>
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
              <b>{PercentZero.format(objective)}</b> fully protected fisheries
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
              <b>{PercentZero.format(objective)}</b> fully protected fisheries
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
              <b>{PercentZero.format(objective)}</b> fully protected fisheries
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
  const needed =
    GOAL -
    levelMap["full"].percPlanningArea -
    levelMap["high"].percPlanningArea;

  const progressMsg = (
    <>
      <div style={{ display: "flex", paddingTop: 15 }}>
        <span style={{ paddingBottom: 15, width: 140 }}>
          <b>Designated:</b>
        </span>
        <span>
          <LevelPill level="full">
            {Percent.format(levelMap["full"].percPlanningArea)}
          </LevelPill>{" "}
          +{" "}
          <LevelPill level="high">
            {Percent.format(levelMap["high"].percPlanningArea)}
          </LevelPill>{" "}
          ={" "}
          <Pill>
            {Percent.format(
              levelMap["full"].percPlanningArea +
                levelMap["high"].percPlanningArea
            )}
          </Pill>
        </span>
      </div>
      {needed > 0 && (
        <div style={{ display: "flex" }}>
          <span style={{ width: 140 }}>
            <b>Still needed:</b>
          </span>
          <span>
            <b>{Percent.format(needed)}</b>
          </span>
        </div>
      )}
    </>
  );

  if (levelMap["full"].percPlanningArea > objective) {
    return (
      <ObjectiveStatus
        status="yes"
        msg={
          <>
            This plan meets the objective of designating{" "}
            <b>{PercentZero.format(objective)}</b> of the Bermuda EEZ as fully
            protected fisheries replenishment zones.
          </>
        }
      />
    );
  } else if (
    levelMap["full"].percPlanningArea + levelMap["full"].percPlanningArea >
    objective
  ) {
    return (
      <ObjectiveStatus
        status="maybe"
        msg={
          <>
            <div>
              This plan <b>may</b> meet the objective of designating{" "}
              <b>{PercentZero.format(objective)}</b> of the Bermuda EEZ as fully
              protected fisheries replenishment zones.
            </div>
            {progressMsg}
          </>
        }
      />
    );
  } else {
    return (
      <ObjectiveStatus
        status="no"
        msg={
          <>
            <div>
              This plan <b>does not</b> meet the objective of designating{" "}
              <b>{PercentZero.format(objective)}</b> of the Bermuda EEZ as fully
              protected fisheries replenishment zones.
            </div>
            {progressMsg}
          </>
        }
      />
    );
  }
};

const genLearnMore = () => {
  return (
    <Collapse title="Learn more">
      <p>
        This report looks at each MPAs allowed activities and assigns the first
        viable MPA category that allows all of those actitivities.
      </p>

      <p>
        The categories are{" "}
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

      <p>
        Category 1-3 offer full protection and are suitable for inclusion in 20%
        fully protected fisheries replenishment zone. Category 4-6 may offer
        high protection and may be suitable, if allowed uses are aligned with
        objectives. Those that do not receive a category are not suitable and
        have low protection.
      </p>
      <p>[INSERT LIST MAPPING CATEGORIES TO FULL/HIGH PROTECTION]</p>
      <p>[INSERT IMAGE WITH TABLE MATRIX]</p>
      <p>
        Categories 2 and 3 have the same allowed activities, so they are
        grouped. This means they can both be viable options for a given plan and
        are reported together. The right option will be the one that best
        matches the objectives. Categories 4 and 6 also have the same allowed
        activities and are grouped.
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
          circleText={row.numSketches}
          rowText={`${capitalize(row.level)} Protection MPA${
            row.numSketches === 1 ? "" : "s"
          }`}
        />
      ),
      style: { width: "85%" },
    },
    {
      Header: "% EEZ",
      accessor: (row) => (
        <LevelPill level={row.level}>
          {Percent.format(row.percPlanningArea)}
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
      style: { width: "10%" },
    },
    {
      Header: "Category",
      accessor: (row) => genCategoryRowText(row),
      style: { width: "75%" },
    },
    {
      Header: "% EEZ",
      accessor: (row) => Percent.format(row.percPlanningArea),
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
      style: { width: "30%" },
    },
    {
      Header: "Category",
      accessor: (row) => genCategoryRowText(row),
      style: { width: "55%" },
    },
    {
      Header: "% EEZ",
      accessor: (row) => Percent.format(row.percPlanningArea),
      style: { width: "15%" },
    },
  ];

  return (
    <SmallTableStyled>
      <Table
        className="squeeze"
        columns={columns}
        data={sketchStats.sort((a, b) => a.level.localeCompare(b.level))}
      />
    </SmallTableStyled>
  );
};

const levelToCounts = (level: string) => {
  switch (level) {
    case "full":
      return "yes";
      break;
    case "high":
      return "TBD";
      break;
    default:
      return "no";
  }
};

export default ProtectionCard;
