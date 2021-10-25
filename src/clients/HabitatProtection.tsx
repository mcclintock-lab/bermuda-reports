import React from "react";
import {
  LayerToggle,
  ResultsCard,
  Skeleton,
  Table,
  Column,
  keyBy,
  percentLower,
} from "@seasketch/geoprocessing/client";
// Import the results type definition from your functions to type-check your
// component render functions
import { AreaResult } from "../functions/area";
import config, { OverlapMetric } from "../functions/habitatProtectionConfig";

const Number = new Intl.NumberFormat("en", { style: "decimal" });

const HabitatProtection = () => {
  const offshoreClasses = keyBy(config.offshore.layers, (lyr) => lyr.name);

  const offshoreColumns: Column<OverlapMetric>[] = [
    {
      Header: "Offshore",
      accessor: (row) => offshoreClasses[row.class],
    },
    {
      Header: "% Within Plan",
      style: { textAlign: "center" },
      accessor: (row) => {
        const num = percentLower(row.sketchArea / row.totalArea);
        return num === "0%" ? "-" : num;
      },
    },
    {
      Header: "Show Map",
      accessor: (row) => (
        <LayerToggle
          simple
          layerId={offshoreClasses[row.class].layerId}
          style={{ marginTop: 0, marginLeft: 15 }}
        />
      ),
      style: { width: "20%" },
    },
  ];

  const nearshoreColumns: Column<OverlapMetric>[] = [
    {
      Header: "Nearshore/Platform",
      accessor: (row) => config.nearshore.classIdToName[row.class_id || "0"],
    },
    {
      Header: "% Within Plan",
      style: { textAlign: "center" },
      accessor: (row) => {
        const num = percentLower(row.sketchArea / row.totalArea);
        return num === "0%" ? "-" : num;
      },
    },
    {
      Header: "Show Map",
      accessor: (row) => (
        <LayerToggle
          simple
          layerId={config.nearshore.layerId}
          style={{ marginTop: 0, marginLeft: 15 }}
        />
      ),
      style: { width: "20%" },
    },
  ];

  return (
    <>
      <ResultsCard
        title="Habitat Protection"
        functionName="area"
        skeleton={<LoadingSkeleton />}
      >
        {(data: AreaResult) => {
          return (
            <>
              <p>
                Plans should ensure the representative coverage of each key
                habitat type. This report summarizes the percentage of each
                habitat that overlaps with this plan.
              </p>
              <Table columns={nearshoreColumns} data={[]} />
              <Table columns={offshoreColumns} data={[]} />
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

export default HabitatProtection;
