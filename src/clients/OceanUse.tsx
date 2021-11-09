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
                Plans should ensure continued access to the most highly valued
                areas for each sector. This report summarizes how much value
                falls within this MPA plan for each sector . The higher the
                percentage, the greater the potential impact if access or
                activities are restricted.
              </p>
              <p></p>

              <Collapse title="Learn more">
                <p>
                  To capture the value each sector places on different areas
                  within Bermuda waters, an Ocean Use Survey was conducted.
                  Individuals identified the sectors they participate in, and
                  were asked to draw the areas they use relative to that sector
                  and assign a value of importance. Individual responses were
                  then combined to produce aggregate heatmaps by sector.
                </p>
                <p>
                  Note, the resulting heatmaps are only representative of the
                  individuals that were surveyed.
                </p>
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
        return sectorName
      },
      style: { width: "65%" },
    },
    {
      Header: "% Value In Plan",
      accessor: (row) => {
        return percentLower(row.percValue, { lower: 0.01, digits: 1 });
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
