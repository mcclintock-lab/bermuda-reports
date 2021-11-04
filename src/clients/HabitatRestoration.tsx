import React from "react";
import {
  ResultsCard,
  Skeleton,
  Column,
  Table,
  percentLower,
  LayerToggle,
  keyBy,
} from "@seasketch/geoprocessing/client";
import { Collapse } from "../components/Collapse";
import config, { HabitatRestoreResults } from "../_config";
import { ClassMetric } from "../util/types";
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

const HabitatRestoration = () => {
  const classes = keyBy(
    config.habitatRestore.layers,
    (lyr) => lyr.baseFilename
  );

  const columns: Column<ClassMetric>[] = [
    {
      Header: "Restoration Type",
      accessor: (row) => classes[row.name].display,
      style: { width: "30%" },
    },
    {
      Header: "% Area Within Plan",
      style: { textAlign: "right", width: "40%" },
      accessor: (row) => percentLower(row.percValue),
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
      style: { width: "30%" },
    },
  ];

  return (
    <>
      <ResultsCard
        title="Habitat Restoration"
        functionName="habitatRestore"
        skeleton={<LoadingSkeleton />}
      >
        {(data: HabitatRestoreResults) => {
          const results = Object.values(data.restore);
          return (
            <>
              <p>
                This report summarizes the amount of potential restoration area
                within this plan for each habitat type.
              </p>
              <Collapse title="Learn more">
                <p>
                  For each habitat where suitable data exists, areas have been
                  mapped with habitat restoration potential.
                </p>
                <p>
                  Objectives:
                  <ul>
                    <li>
                      Establish active restoration of areas that were formerly
                      seagrass habitats (100m2) through turtle exclusion.
                    </li>
                    <li>
                      Inventory and assess past, present and potential salt
                      marsh and mangrove habitat areas and develop a strategic
                      plan for conservation and restoration.
                    </li>
                    <li>
                      Initiate active restoration of threatened mangrove
                      habitats.
                    </li>
                    <li>
                      Initiate active restoration of damaged and/or degraded
                      coral habitats in protected areas.
                    </li>
                  </ul>
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

export default HabitatRestoration;
