import React from "react";
import {
  ResultsCard,
  Skeleton,
  Column,
  Table,
  percentWithEdge,
  LayerToggle,
  keyBy,
  ReportError,
  useSketchProperties,
} from "@seasketch/geoprocessing/client";
import { Collapse } from "../components/Collapse";
import config, { HabitatRestoreResults } from "../_config";
import { ClassMetric } from "../util/types";
import styled from "styled-components";

const TableStyled = styled.div`
  .styled {
    td {
      padding: 5px 5px;
    }
  }
}
`;

const LAYERS = config.habitatRestore.layers;
const CLASSES = keyBy(LAYERS, (lyr) => lyr.baseFilename);

const HabitatRestoration = () => {
  const [{ isCollection, userAttributes }] = useSketchProperties();

  return (
    <>
      <ResultsCard
        title="Habitat Restoration"
        functionName="habitatRestore"
        skeleton={<LoadingSkeleton />}
      >
        {(data: HabitatRestoreResults) => {
          const results = Object.values(data.byClass);
          return (
            <>
              <p>
                Areas with restoration potential have been identified for
                multiple habitat types with the objective of identifying and
                restoring these areas. This report summarizes the amount of
                potential restoration area within this plan. It is for
                informational purposes and not a requirement for inclusion in
                MPAs.
              </p>
              <Collapse title="Learn more">
                <p>
                  A suitability analysis was conducted for multiple habitat
                  types and identified areas with restoration potential.
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
              <ReportError>
                {isCollection ? genNetwork(data) : genSingle(data)}
              </ReportError>
            </>
          );
        }}
      </ResultsCard>
    </>
  );
};

const genSingle = (data: HabitatRestoreResults) => {
  return <>{genTable(Object.values(data.byClass))}</>;
};

const genNetwork = (data: HabitatRestoreResults) => {
  // Build agg sketch group objects with percValue for each class
  // groupId, sketchId, lagoon, mangrove, seagrass, total
  // const sketchRows = getSketchAgg(
  //   data.byClass,
  //   precalcTotals.overall.value,
  //   config.habitatNursery.layers
  // );

  return <>{genTable(Object.values(data.byClass))}</>;
};

const genTable = (data: ClassMetric[]) => {
  const columns: Column<ClassMetric>[] = [
    {
      Header: "Restoration Type",
      accessor: (row) => CLASSES[row.name].display,
      style: { width: "30%" },
    },
    {
      Header: "% Area Within Plan",
      style: { textAlign: "right", width: "40%" },
      accessor: (row) => percentWithEdge(row.percValue),
    },
    {
      Header: "Show Map",
      accessor: (row) => (
        <LayerToggle
          simple
          layerId={CLASSES[row.name].layerId}
          style={{ marginTop: 0, marginLeft: 15 }}
        />
      ),
      style: { width: "30%" },
    },
  ];

  return (
    <TableStyled>
      <Table className="styled" columns={columns} data={data} />
    </TableStyled>
  );
};

const LoadingSkeleton = () => (
  <p>
    <Skeleton style={{}}>&nbsp;</Skeleton>
  </p>
);

export default HabitatRestoration;
