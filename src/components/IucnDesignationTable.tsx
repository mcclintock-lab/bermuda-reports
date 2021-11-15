import React from "react";
import { iucnCategories, IucnCategory } from "../util/iucnProtectionLevel";
import { Table, Column, capitalize } from "@seasketch/geoprocessing/client";
import { LevelPill, Pill } from "./Pill";
import styled from "styled-components";

const TableStyled = styled.div`
  .table {
    td {
      padding: 5px 5px;
    }
  }
`;

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
    <TableStyled>
      <Table
        className="table"
        columns={columns}
        data={categories.sort((a, b) => a.category.localeCompare(b.category))}
      />
    </TableStyled>
  );
};
