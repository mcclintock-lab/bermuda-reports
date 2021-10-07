import React from "react";
import {
  ResultsCard,
  KeySection,
  Table,
  Column,
} from "@seasketch/geoprocessing/client";
import { STUDY_REGION_AREA_SQ_METERS } from "../functions/areaConstants";

// Import type definitions from function
import { ProtectionResults, SketchCategory } from "../functions/protection";
import {
  getCategoryWithId,
  iucnCategories,
  IucnCategory,
} from "../util/iucnProtectionLevel";

const Number = new Intl.NumberFormat("en", { style: "decimal" });
const Percent = new Intl.NumberFormat("en", {
  style: "percent",
  maximumFractionDigits: 2,
});

const ProtectionCard = () => (
  <ResultsCard title="Protection" functionName="protection">
    {(data: ProtectionResults) => {
      if (data.sketchCategories.length === 0)
        throw new Error("Protection results not found");
      return data.sketchCategories.length > 1
        ? networkProtection(data)
        : singleProtection(data.sketchCategories[0]);
    }}
  </ResultsCard>
);

const singleProtection = (sketchCategory: SketchCategory) => {
  const category: IucnCategory = getCategoryWithId(sketchCategory.category);

  return <>{genProtectionTable([category])}</>;
};

const networkProtection = (data: ProtectionResults) => {
  return <>Foo</>;
};

const genProtectionTable = (categories: IucnCategory[]) => {
  const columns: Column<IucnCategory>[] = [
    {
      Header: "Protection",
      accessor: "level",
    },
    {
      Header: "IUCN Category",
      accessor: (row) => `(${row.category}) ${row.name}`,
    },
  ];
  return <Table columns={columns} data={categories} />;
};

export default ProtectionCard;
