import React from "react";
import {
  ResultsCard,
  SketchAttributesCard,
  Skeleton,
  Column,
  Table,
  LayerToggle,
} from "@seasketch/geoprocessing/client";
import config, {
  OverlapResult,
  OverlapMetric,
} from "../functions/existingProtectionsConfig";
// Import the results type definition from your functions to type-check your
// component render functions

const Number = new Intl.NumberFormat("en", { style: "decimal" });
const Percent = new Intl.NumberFormat("en", {
  style: "percent",
  maximumFractionDigits: 1,
});

const ExistingProtections = () => {
  const columns: Column<OverlapMetric>[] = [
    {
      Header: "Area Type",
      accessor: (row) =>
        config.legislatedLayers.find((layer) => layer.name === row.class)
          ?.display,
    },
    {
      Header: "% Within Plan",
      style: { textAlign: "center" },
      accessor: (row) => {
        const num = Percent.format(row.sketchArea / row.totalArea);
        return num === "0%" ? "-" : num;
      },
    },
    {
      Header: "Show Map",
      accessor: (row) => (
        <LayerToggle
          simple
          layerId={
            config.legislatedLayers.find((layer) => layer.name === row.class)
              ?.layerId || ""
          }
          style={{ marginTop: 0, marginLeft: 15 }}
        />
      ),
      style: { width: "20%" },
    },
  ];

  return (
    <>
      <ResultsCard
        title="Existing Protections"
        functionName="existingProtections"
        skeleton={<LoadingSkeleton />}
      >
        {(data: OverlapResult) => {
          return (
            <Table
              columns={columns}
              data={data.areaByClass.sort((a, b) =>
                a.class.localeCompare(b.class)
              )}
            />
          );
        }}
      </ResultsCard>
    </>
  );
};

const LoadingSkeleton = () => (
  <p>
    <Skeleton style={{}}>&nbsp;</Skeleton>
  </p>
);

export default ExistingProtections;
