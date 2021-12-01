import React from "react";
import {
  LayerToggle,
  ResultsCard,
  Skeleton,
  Table,
  Column,
  keyBy,
  percentWithEdge,
} from "@seasketch/geoprocessing/client";
import config, { HabitatResults, nearshore } from "../_config";
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

const HabitatProtection = () => {
  const offshoreClasses = keyBy(
    config.offshore.layers,
    (lyr) => lyr.baseFilename
  );

  const offshoreColumns: Column<ClassMetric>[] = [
    {
      Header: "Offshore",
      accessor: (row) => offshoreClasses[row.name].display,
      style: { width: "30%" },
    },
    {
      Header: "% Within Plan",
      style: { textAlign: "right", width: "30%" },
      accessor: (row) => {
        const percDisplay = percentWithEdge(row.percValue);
        const goal =
          config.offshore.layers.find((lyr) => lyr.baseFilename === row.name)
            ?.goalPerc || 0;
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
      accessor: (row) => {
        const goalPerc = config.offshore.layers.find(
          (lyr) => lyr.baseFilename === row.name
        )?.goalPerc;
        return percentWithEdge(goalPerc || 0);
      },
    },
    {
      Header: "Show Map",
      accessor: (row) => (
        <LayerToggle
          simple
          layerId={offshoreClasses[row.name].layerId}
          style={{ marginTop: 0, marginLeft: 15 }}
        />
      ),
      style: { width: "20%" },
    },
  ];

  const nearshoreColumns: Column<ClassMetric>[] = [
    {
      Header: "Nearshore/Platform",
      accessor: (row) => row.name,
      style: { width: "30%" },
    },
    {
      Header: "% Within Plan",
      style: { textAlign: "right", width: "30%" },
      accessor: (row) => {
        const percDisplay = percentWithEdge(row.percValue);
        const goal =
          config.nearshore.layers.find((lyr) => lyr.name === row.name)
            ?.goalPerc || 0;
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
        const goalPerc = config.nearshore.layers.find(
          (lyr) => lyr.name === row.name
        )?.goalPerc;
        return percentWithEdge(goalPerc || 0);
      },
    },
    {
      Header: "Show Map",
      accessor: (row, index) => {
        return index == 0 ? (
          <LayerToggle
            simple
            layerId={nearshore.layerId}
            style={{ marginTop: 0, marginLeft: 15 }}
          />
        ) : (
          <></>
        );
      },
      style: { width: "20%" },
    },
  ];

  return (
    <>
      <ResultsCard
        title="Habitat Protection"
        functionName="habitatProtection"
        skeleton={<LoadingSkeleton />}
      >
        {(data: HabitatResults) => {
          const nearshore = Object.values(data.nearshore);
          const offshore = Object.values(data.offshore);
          return (
            <>
              <p>
                Plans should ensure the representative coverage of each key
                habitat type. This report summarizes the percentage of each
                habitat that overlaps with this plan.
              </p>
              <Collapse title="Learn more">
                <p>
                  The Steering Committee approved the objective of ensuring a
                  20% representative coverage of each key habitat type when
                  designating fully protected MPAs, and higher coverage as
                  needed to satisfy other objectives. Only MPAs with a Full
                  Protection designation count towards meeting this objective.
                </p>
              </Collapse>
              <TableStyled>
                <Table
                  className="styled"
                  columns={nearshoreColumns}
                  data={nearshore}
                />
              </TableStyled>
              <TableStyled>
                <Table
                  className="styled"
                  columns={offshoreColumns}
                  data={offshore}
                />
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

export default HabitatProtection;
