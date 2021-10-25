import React from "react";
import {
  ResultsCard,
  Skeleton,
  Column,
  Table,
  LayerToggle,
  percentLower,
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
      accessor: (row) =>
        percentLower(row.sketchArea / row.totalArea, {
          lower: 0.01,
          digits: 1,
        }),
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
            <>
              <p>
                Plans should consider and optimize for overlap with existing
                protected areas. This report summarizes the percentage of
                currently legislated areas that overlap with this plan.
              </p>
              <Table
                columns={columns}
                data={data.areaByClass.sort((a, b) =>
                  a.class.localeCompare(b.class)
                )}
              />
            </>
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
