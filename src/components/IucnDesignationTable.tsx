import React from "react";
import { iucnCategories, IucnCategory } from "../util/iucnProtectionLevel";
import { capitalize } from "@seasketch/geoprocessing/client-core";
import { Table, Column } from "@seasketch/geoprocessing/client-ui";
import { LevelPill, Pill } from "./Pill";
import { ReportTableStyled } from "./ReportTableStyled";

const columns: Column<IucnCategory>[] = [
  {
    Header: "Category",
    accessor: (row) => (
      <span>
        {row.category !== "None" && <Pill>{row.category}</Pill>}
        {` ${row.name}`}
      </span>
    ),
  },
  {
    Header: "Protection Level",
    accessor: (row) => (
      <LevelPill level={row.level}>{capitalize(row.level)}</LevelPill>
    ),
  },
];

export const IucnDesignationTable = () => {
  const categories: IucnCategory[] = Object.values(iucnCategories).reduce<
    IucnCategory[]
  >((acc, combCat) => {
    return combCat.categories
      ? acc.concat(
          combCat.categories.map((cat) => ({ ...cat, level: combCat.level }))
        )
      : acc.concat({
          category: combCat.category,
          name: combCat.name,
          level: combCat.level,
        });
  }, []);
  return (
    <ReportTableStyled>
      <Table
        className="table"
        columns={columns}
        data={categories.sort((a, b) => a.category.localeCompare(b.category))}
      />
    </ReportTableStyled>
  );
};
