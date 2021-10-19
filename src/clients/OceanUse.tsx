import React from "react";
import {
  ResultsCard,
  Skeleton,
  Table,
  Column,
  percentLower,
  LayerToggle,
} from "@seasketch/geoprocessing/client";
import { Collapse } from "../components/Collapse";
import { WarningPill } from "../components/Pill";
import styled from "styled-components";
import { SapMapResults } from "../functions/oceanUse";
import { rasterConfig } from "../functions/oceanUseConfig";

const Number = new Intl.NumberFormat("en", { style: "decimal" });

const OverallUseTableStyled = styled.div`
  .styled {
    td:not(:first-child),
    th:not(:first-child) {
      text-align: right;
    }
    td {
      padding: 5px 5px;
    }
  }
}
`;

const OceanUse = () => {
  return (
    <>
      <ResultsCard
        title="Ocean Use"
        functionName="oceanUse"
        skeleton={<LoadingSkeleton />}
      >
        {(data: SapMapResults) => {
          // Overall: one map per row, with show toggle
          // per sketch: one sketch per row
          return (
            <>
              <p>
                Ocean use surveys were conducted to document where activities
                take place in Bermuda waters, and the value individuals place on
                those areas. The responses were combined to produce aggregate
                heatmaps.
              </p>
              <p>
                This report summarizes how much of the overall value for each
                sector falls within this MPA plan. The higher the percentage,
                the greater the potential impact if activities are restricted.
              </p>

              <Collapse title="Learn more">
                <p></p>
                <p>
                  <a
                    target="_blank"
                    href="https://seasketch.github.io/python-sap-map/algorithm.html"
                  >
                    Read more
                  </a>{" "}
                  about how the heatmaps are generated from ocean use surveys.
                </p>
              </Collapse>

              {genOverallUseTable(data)}
            </>
          );
        }}
      </ResultsCard>
    </>
  );
};

const genOverallUseTable = (data: SapMapResults) => {
  const sapResults = Object.keys(data).map((mapName) => data[mapName]);
  const sapColumns: Column<SapMapResults[0]>[] = [
    {
      Header: "Sector",
      accessor: (row) => {
        const sector = rasterConfig.find((config) => config.name === row.name);
        const sectorName = sector?.display ? sector.display : "";
        if (row.percValue > 0.1) {
          return <WarningPill>{sectorName}</WarningPill>;
        } else {
          return sectorName;
        }
      },
      style: { width: "65%" },
    },
    {
      Header: "% Value In Plan",
      accessor: (row) => {
        const value = percentLower(row.percValue, { lower: 0.01, digits: 1 });
        if (row.percValue > 0.1) {
          return <WarningPill>{value}</WarningPill>;
        } else {
          return value;
        }
      },
      style: { width: "20%" },
    },
    {
      Header: "Show Map",
      accessor: (row) => (
        <LayerToggle
          simple
          layerId={
            rasterConfig.find((config) => config.name === row.name)?.layerId ||
            ""
          }
          style={{ marginTop: 0, paddingLeft: 15 }}
        />
      ),
      style: { width: "15%" },
    },
  ];

  return (
    <OverallUseTableStyled>
      <Table className="styled" columns={sapColumns} data={sapResults} />
    </OverallUseTableStyled>
  );
};

const LoadingSkeleton = () => (
  <p>
    <Skeleton style={{}}>&nbsp;</Skeleton>
  </p>
);

export default OceanUse;
