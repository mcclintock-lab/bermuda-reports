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
import config, { RenewableResults } from "../_config";
import { ClassMetric } from "../util/types";
import { Collapse } from "../components/Collapse";
import styled from "styled-components";

const TableStyled = styled.div`
  .styled {
    td {
      padding: 5px 5px;
    }
  }
}
`;

const LAYERS = config.renewable.layers;

const SpeciesProtection = () => {
  const classes = keyBy(LAYERS, (lyr) => lyr.baseFilename);

  const columns: Column<ClassMetric>[] = [
    {
      Header: "Type",
      accessor: (row) => classes[row.name].display,
      style: { width: "50%" },
    },
    {
      Header: "% Within Plan",
      style: { textAlign: "right", width: "30%" },
      accessor: (row, index) => {
        return percentLower(row.percValue);
      },
    },
    {
      Header: "Show Map",
      accessor: (row) => (
        <LayerToggle
          simple
          layerId={classes[row.name].layerId}
          style={{ marginTop: 0, marginLeft: 15 }}
        />
      ),
      style: { width: "20%" },
    },
  ];

  return (
    <>
      <ResultsCard
        title="Renewable Energy"
        functionName="renewable"
        skeleton={<LoadingSkeleton />}
      >
        {(data: RenewableResults) => {
          const results = Object.values(data.renewable);
          return (
            <>
              <p>
                Potential energy production zones were identified for 4 types of
                renewable energy. This report summarizes the percentage of each
                potential use area within this plan.
              </p>
              <Collapse title="Learn more">
                <p>
                  Objective: Identify potential energy production zones that
                  recognize the physical characteristics and criteria that
                  should be considered when placing ocean renewable technologies
                  for the purpose of delineating the broadest areas where these
                  technologies could be implemented in Bermuda’s EEZ with the
                  lowest potential impact to ecosystem function.
                </p>
                <p>
                  Calculation: the Bermuda EEZ is divided into a grid and for
                  each renewable technology a suitability value is calculated.
                  The results forms a heatmap. The higher a cells value, the
                  higher the potential for using that area for energy
                  production. The percentage of potential use area within this
                  plan is then assessed. For each of the 4 renewable
                  technologies, the value of all of the grid cells within the
                  boundaries of this plan are summed, and then divided by the
                  total value of all cells in the EEZ.
                </p>
              </Collapse>
              <TableStyled>
                <Table className="styled" columns={columns} data={results} />
              </TableStyled>
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

export default SpeciesProtection;
