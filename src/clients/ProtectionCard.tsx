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
      {genSingleSketchTable([category])}
    </>
  );
};

const networkProtection = (data: ProtectionResult) => {
  const levelMap = keyBy(data.levelStats, (item) => item.level);
  return (
    <>
      {genNetworkObjective(levelMap, 0.2)}
      {genLevelTable(data.levelStats)}
      <Collapse title="Show more detail">
        <p>Summary By MPA Category</p>
        {genCategoryTable(data.categoryStats)}
        <p>Summary By MPA</p>
        {genSketchTable(data.sketchStats)}
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
  if (levelMap["full"].percPlanningArea > objective) {
    return (
      <ObjectiveStatus
        status="yes"
        msg={
          <>
            This plan meets the objective of designating{" "}
            <b>{PercentZero.format(objective)}</b> of Bermuda waters as fully
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
            This plan <b>may</b> meet the objective of designating{" "}
            <b>{PercentZero.format(objective)}</b> of Bermuda waters as fully
            protected fisheries replenishment zones.
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
            This plan <b>does not</b> meet the objective of designating{" "}
            <b>{PercentZero.format(objective)}</b> of Bermuda waters as fully
            protected fisheries replenishment zones.
          </>
        }
      />
    );
  }
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

const TableStyled = styled.div`
  .squeeze {
    font-size: 12px;
  }
`;

const genSketchTable = (sketchStats: SketchStat[]) => {
  const columns: Column<SketchStat>[] = [
    {
      Header: "MPA",
      accessor: "name",
      style: { width: "30%" },
    },
    {
      Header: "Category",
      accessor: (row) =>
        `(${row.category === "None" ? "-" : row.category}) ${
          iucnCategories[row.category].name
        }`,
      style: { width: "30%" },
    },
    {
      Header: "Protection",
      accessor: (row) => capitalize(row.level),
      style: { width: "20%" },
    },
    {
      Header: "% EEZ",
      accessor: (row) => Percent.format(row.percPlanningArea),
      style: { width: "10%" },
    },
    {
      Header: "Counts Objective?",
      accessor: (row) => capitalize(levelToCounts(row.level)),
      style: { width: "10%" },
    },
  ];

  return (
    <TableStyled>
      <Table
        className="squeeze"
        columns={columns}
        data={sketchStats.sort((a, b) => a.level.localeCompare(b.level))}
        cellProps={cellColorFn}
      />
    </TableStyled>
  );
};

const genCategoryTable = (categoryStats: CategoryStat[]) => {
  const columns: Column<CategoryStat>[] = [
    {
      Header: "# MPAs",
      accessor: "numSketches",
      style: { width: "20%" },
    },
    {
      Header: "Category",
      accessor: (row) =>
        `(${row.category === "None" ? "-" : row.category}) ${
          iucnCategories[row.category].name
        }`,
      style: { width: "30%" },
    },
    {
      Header: "Protection",
      accessor: (row) => capitalize(row.level),
      style: { width: "20%" },
    },
    {
      Header: "% EEZ",
      accessor: (row) => Percent.format(row.percPlanningArea),
      style: { width: "10%" },
    },
    {
      Header: "Counts Objective?",
      accessor: (row) => capitalize(levelToCounts(row.level)),
      style: { width: "10%" },
    },
  ];

  return (
    <TableStyled>
      <Table
        className="squeeze"
        columns={columns}
        data={categoryStats.sort((a, b) => a.level.localeCompare(b.level))}
        cellProps={cellColorFn}
      />
    </TableStyled>
  );
};

const genLevelTable = (levelStats: LevelStat[]) => {
  const columns: Column<LevelStat>[] = [
    {
      Header: "# MPAs",
      accessor: "numSketches",
    },
    {
      Header: "Protection",
      accessor: (row) => capitalize(row.level),
    },
    {
      Header: "% EEZ",
      accessor: (row) => Percent.format(row.percPlanningArea),
    },
    {
      Header: "Counts Objective?",
      accessor: (row) => capitalize(levelToCounts(row.level)),
      style: { width: "10%" },
    },
  ];

  return (
    <TableStyled>
      <Table
        className="squeeze"
        columns={columns}
        data={levelStats.sort((a, b) => a.level.localeCompare(b.level))}
        cellProps={cellColorFn}
      />
    </TableStyled>
  );
};

const cellColorFn = (cell: any) => {
  if (cell.column.id === "Counts Objective?") {
    switch (cell.value) {
      case "Yes":
        return { style: { backgroundColor: "#BEE4BE" } };
      case "TBD":
        return { style: { backgroundColor: "#FFE1A3" } };
      case "No":
        return { style: { backgroundColor: "#F7A6B4" } };
      default:
        return {};
    }
  }
  return {};
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
