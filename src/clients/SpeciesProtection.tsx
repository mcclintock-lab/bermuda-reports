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
import config, { ReefIndexResults, nearshore } from "../_config";
import { ClassMetric } from "../util/types";
import { Collapse } from "../components/Collapse";
import { GreenPill } from "../components/Pill";
import styled from "styled-components";

const TableStyled = styled.div`
  .styled {
    td {
      padding: 5px 5px;
    }
  }
}
`;

const LAYERS = config.reefIndex.layers;

const SpeciesProtection = () => {
  const classes = keyBy(LAYERS, (lyr) => lyr.baseFilename);

  const columns: Column<ClassMetric>[] = [
    {
      Header: "Indicator",
      accessor: (row) => classes[row.name].display,
      style: { width: "30%" },
    },
    {
      Header: "% Within Plan",
      style: { textAlign: "right", width: "30%" },
      accessor: (row, index) => {
        const percDisplay = percentLower(row.percValue);
        const goal = LAYERS[index].goalPerc;
        if (row.percValue > goal) {
          return <GreenPill>{percDisplay}</GreenPill>;
        } else {
          return percDisplay;
        }
      },
    },
    {
      Header: "Goal",
      style: { textAlign: "right", width: "20%" },
      accessor: (row, index) => {
        const goalPerc = LAYERS.find((lyr) => lyr.baseFilename === row.name)
          ?.goalPerc;
        return percentLower(goalPerc || 0);
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
        title="Species Protection"
        functionName="reefIndex"
        skeleton={<LoadingSkeleton />}
      >
        {(data: ReefIndexResults) => {
          const results = Object.values(data.reefIndex);
          return (
            <>
              <p>
                Plans should prioritize areas of high quality habitat used by
                unique, rare, and/or threatened species named in the Protected
                Species Act. High quality habitat areas have been determined
                using 9 different measures of reef health. This report
                summarizes the proportion of high quality habitat within this
                plan for each measure.
              </p>
              <Collapse title="Learn more">
                <p>
                  Objective: When designing marine protected areas, prioritize
                  those areas that seek to protect habitat used by unique, rare,
                  and/or threatened species named in the Protected Species Act.
                </p>
                <p>
                  A reef index has been developed that identifies the best
                  habitat based on 9 different measures of reef health. Goals
                  have been established for each measure to prioritize
                  representative coverage of different high quality habitat
                  types.
                </p>
                <p>
                  There are areas that will score high for multiple measures of
                  reef health and may be good candidates for inclusion in a
                  plan.
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
