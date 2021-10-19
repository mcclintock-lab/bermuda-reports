import React from "react";
import {
  ResultsCard,
  Table,
  Column,
  capitalize,
  keyBy,
  percentLower,
  ReportError,
} from "@seasketch/geoprocessing/client";
import styled from "styled-components";
import { ObjectiveStatus } from "../components/ObjectiveStatus";
import { Pill, LevelPill } from "../components/Pill";
import { LevelCircleRow } from "../components/Circle";

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

const Percent = new Intl.NumberFormat("en", {
  style: "percent",
  maximumFractionDigits: 1,
});
const PercentZero = new Intl.NumberFormat("en", {
  style: "percent",
  maximumFractionDigits: 0,
});

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

const ProtectionCard = () => (
  <ResultsCard title="Protection Level" functionName="protection">
    {(data: ProtectionResult) => {
      if (data.sketchStats.length === 0)
        throw new Error("Protection results not found");
      return (
        <ReportError>
          {data.sketchStats.length > 1
            ? networkProtection(data)
            : singleProtection(data.sketchStats[0])}
        </ReportError>
      );
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
  const fullPerc = levelMap["full"]?.percPlanningArea || 0;
  const highPerc = levelMap["high"]?.percPlanningArea || 0;
  const needed = config.eezObjective - fullPerc - highPerc;

  const lower = percentLower(fullPerc, {
    lower: 0.001,
    digits: 1,
  });

  const fullPercDisplay =
    fullPerc === 0
      ? Percent.format(fullPerc)
      : percentLower(fullPerc, {
          lower: 0.001,
          digits: 1,
        });

  const highPercDisplay =
    highPerc === 0
      ? Percent.format(highPerc)
      : percentLower(highPerc, {
          lower: 0.001,
          digits: 1,
        });

  const combinedPercDisplay =
    fullPerc + highPerc === 0
      ? Percent.format(fullPerc + highPerc)
      : percentLower(fullPerc + highPerc, {
          lower: 0.001,
          digits: 1,
        });

  const progressMsg = (
    <>
      <div style={{ display: "flex", paddingTop: 15 }}>
        <span style={{ paddingBottom: 15, width: 140 }}>
          <b>Designated:</b>
        </span>
        <span>
          <LevelPill level="full">{fullPercDisplay}</LevelPill> +{" "}
          <LevelPill level="high">{highPercDisplay}</LevelPill> ={" "}
          <Pill>{combinedPercDisplay}</Pill>
        </span>
      </div>
      {needed > 0 && (
        <div style={{ display: "flex" }}>
          <span style={{ width: 140 }}>
            <b>Still needed:</b>
          </span>
          <span>
            <b>{percentLower(needed, { lower: 0.1, digits: 1 })}</b>
          </span>
        </div>
      )}
    </>
  );

  if (fullPerc > objective) {
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
  } else if (fullPerc + highPerc > objective) {
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
          circleText={`${row.numSketches}`}
          rowText={`${capitalize(row.level)} Protection MPA${
            row.numSketches === 1 ? "" : "s"
          }`}
        />
      ),
    },
    {
      Header: "% EEZ",
      accessor: (row) => (
        <LevelPill level={row.level}>
          {row.percPlanningArea === 0
            ? Percent.format(row.percPlanningArea)
            : percentLower(row.percPlanningArea, {
                lower: 0.001,
                digits: 1,
              })}
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
        percentLower(row.percPlanningArea, { lower: 0.001, digits: 1 }),
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
          {percentLower(row.percPlanningArea, {
            lower: 0.001,
            digits: 1,
          })}
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
