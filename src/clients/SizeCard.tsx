import React from "react";
import {
  ResultsCard,
  squareMeterToMile,
  LayerToggle,
  Column,
  Table,
  useSketchProperties,
  percentWithEdge,
} from "@seasketch/geoprocessing/client";
import { Collapse } from "../components/Collapse";
import styled from "styled-components";

// Import type definitions from function
import { AreaResult, AreaResultType } from "../functions/area";

const Number = new Intl.NumberFormat("en", { style: "decimal" });

export interface RegionResult {
  region: string;
  area: number;
  percArea: number;
}

const regionLabels: Record<string, string> = {
  eez: "EEZ",
  nearshore: "Nearshore",
  offshore: "Offshore",
};

const SingleTableStyled = styled.span`
  table {
    width: 90%;
  }
  td,
  th {
    text-align: right;
  }
`;

const TableStyled = styled.div`
  font-size: 12px;
  td {
    text-align: right;
  }

  tr:nth-child(1) > th:nth-child(n + 1) {
    text-align: center;
  }

  tr:nth-child(2) > th:nth-child(n + 1) {
    text-align: center;
  }

  tr > td:nth-child(1),
  tr > th:nth-child(1) {
    border-right: 1px solid #777;
  }

  tr:nth-child(1) > th:nth-child(2) {
    border-right: 1px solid #777;
  }

  tr > td:nth-child(3),
  tr > th:nth-child(3) {
    border-right: 1px solid #777;
  }
  tr > td:nth-child(5),
  tr > th:nth-child(5) {
    border-right: 1px solid #777;
  }
`;

const SizeCard = () => {
  const [{ isCollection }] = useSketchProperties();
  return (
    <ResultsCard title="Size" functionName="area">
      {(data: AreaResult) => {
        if (Object.keys(data).length === 0)
          throw new Error("Protection results not found");

        const areaUnitDisplay = "square kilometers";

        return (
          <>
            <p>
              Plans should be large enough to sustain focal species within their
              boundaries during their adult and juvenile life history phases.
              This report summarizes the size and proportion of this plan within
              the Bermuda EEZ, the nearshore (0-2,000m depth) and offshore
              (2,000m+ depth).
            </p>

            <Collapse title="Learn more">
              <p>
                The Exclusive Economic Zone EEZ extends from the shoreline out
                to 200 nautical miles. The EEZ is further split up into two
                distinct subregions, nearshore which extends from 0-2,000 meters
                depth (6,562 feet) and offshore, which extends from 2,000 meters
                depth and up.
              </p>
              <p>
                Guidance on recommended size: Marine management areas must be
                large enough to sustain focal species within their boundaries
                during their adult and juvenile life history phases. Different
                species move different distances as adults and juveniles, so
                larger areas may include more species.
              </p>
            </Collapse>

            {genSingleSizeTable(data)}

            {isCollection && (
              <Collapse title="Show by MPA">
                {genNetworkSizeTable(data)}
              </Collapse>
            )}

            <LayerToggle
              label="View Nearshore 0-2000m Boundary Layer"
              layerId="6164aebea04323106537eb5a"
            />
          </>
        );
      }}
    </ResultsCard>
  );
};

const genSingleSizeTable = (data: AreaResult) => {
  const regionResults: RegionResult[] = Object.keys(data).map((key) => {
    return {
      region: key,
      ...data[key as AreaResultType],
    };
  });
  const areaColumns: Column<RegionResult>[] = [
    {
      Header: " ",
      accessor: (row) => <b>{regionLabels[row.region]}</b>,
    },
    {
      Header: "Area Within Plan",
      accessor: (row) =>
        Number.format(Math.round(squareMeterToMile(row.area))) + " sq. mi.",
    },
    {
      Header: "% Within Plan",
      accessor: (row) => percentWithEdge(row.percArea),
    },
  ];

  return (
    <SingleTableStyled>
      <Table columns={areaColumns} data={regionResults} />
    </SingleTableStyled>
  );
};

const genNetworkSizeTable = (data: AreaResult) => {
  type MergedAreaResult = {
    sketchId: string;
    name: string;
    overallArea: number;
    overallPercArea: number;
    nearshoreArea: number;
    nearshorePercArea: number;
    offshoreArea: number;
    offshorePercArea: number;
  };

  const rows: MergedAreaResult[] = data.eez.sketchAreas.map(
    (eezArea, index) => {
      const nearshoreArea = data.nearshore.sketchAreas[index];
      const offshoreArea = data.offshore.sketchAreas[index];
      return {
        sketchId: eezArea.sketchId,
        name: eezArea.name,
        overallArea: eezArea.area,
        overallPercArea: eezArea.percArea,
        nearshoreArea: nearshoreArea.area,
        nearshorePercArea: nearshoreArea.percArea,
        offshoreArea: offshoreArea.area,
        offshorePercArea: offshoreArea.percArea,
      };
    }
  );

  const columns: Column<MergedAreaResult>[] = [
    {
      Header: " ",
      accessor: (row) => <b>{row.name}</b>,
    },
    {
      Header: "Nearshore",
      style: { color: "#777" },
      columns: [
        {
          Header: "Area",
          accessor: (row) =>
            Number.format(Math.round(squareMeterToMile(row.nearshoreArea))) +
            " sq. mi.",
        },
        {
          Header: "% Area",
          accessor: (row) =>
            percentWithEdge(row.nearshorePercArea, { lowerOverride: "0.1%" }),
        },
      ],
    },
    {
      Header: "Offshore",
      style: { color: "#777" },
      columns: [
        {
          Header: "Area ",
          accessor: (row) =>
            Number.format(Math.round(squareMeterToMile(row.offshoreArea))) +
            " sq. mi.",
        },
        {
          Header: "% Area ",
          accessor: (row) => percentWithEdge(row.offshorePercArea),
        },
      ],
    },
    {
      Header: "EEZ",
      style: { color: "#777" },
      columns: [
        {
          Header: "Area  ",
          accessor: (row) =>
            Number.format(Math.round(squareMeterToMile(row.overallArea))) +
            " sq. mi.",
        },
        {
          Header: "% Area  ",
          accessor: (row) => percentWithEdge(row.overallPercArea),
        },
      ],
    },
  ];

  return (
    <TableStyled>
      <Table columns={columns} data={rows} />
    </TableStyled>
  );
};

export default SizeCard;
