import React from "react";
import {
  ResultsCard,
  Skeleton,
  Table,
  Column,
  percentWithEdge,
  LayerToggle,
  keyBy,
} from "@seasketch/geoprocessing/client";
import { Collapse } from "../components/Collapse";
import styled from "styled-components";
import config, { OceanUseResults } from "../_config";
import { ClassMetric } from "../util/types";

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

const LAYERS = config.oceanUse.layers;

const OceanUse = () => {
  return (
    <>
      <ResultsCard
        title="Ocean Use"
        functionName="oceanUse"
        skeleton={<LoadingSkeleton />}
      >
        {(data: OceanUseResults) => {
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

const genOverallUseTable = (data: OceanUseResults) => {
  const classes = keyBy(LAYERS, (lyr) => lyr.baseFilename);
  const columns: Column<ClassMetric>[] = [
    {
      Header: "Sector",
      accessor: (row) => {
        const sectorName = config.oceanUse.layers.find(
          (lyr) => lyr.baseFilename === row.name
        )?.display;
        return sectorName || "";
      },
      style: { width: "65%" },
    },
    {
      Header: "% Value In Plan",
      accessor: (row) => {
        return percentWithEdge(row.percValue, { lower: 0.01, digits: 1 });
      },
      style: { width: "20%" },
    },
    {
      Header: "Show Map",
      accessor: (row) => (
        <LayerToggle
          simple
          layerId={
            config.oceanUse.layers.find((lyr) => lyr.baseFilename === row.name)
              ?.layerId || ""
          }
          style={{ marginTop: 0, paddingLeft: 15 }}
        />
      ),
      style: { width: "15%" },
    },
  ];

  return (
    <OverallUseTableStyled>
      <Table
        className="styled"
        columns={columns}
        data={Object.values(data.byClass)}
      />
    </OverallUseTableStyled>
  );
};

const LoadingSkeleton = () => (
  <p>
    <Skeleton style={{}}>&nbsp;</Skeleton>
  </p>
);

export default OceanUse;
