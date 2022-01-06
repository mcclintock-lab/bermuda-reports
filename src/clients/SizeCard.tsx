import React from "react";
import {
  squareMeterToMile,
  percentWithEdge,
  keyBy,
  toNullSketchArray,
} from "@seasketch/geoprocessing/client-core";
import {
  ResultsCard,
  LayerToggle,
  Column,
  Table,
  useSketchProperties,
} from "@seasketch/geoprocessing/client-ui";
import { Collapse } from "../components/Collapse";
import styled from "styled-components";
import { ReportTableStyled } from "../components/ReportTableStyled";
import config, { MetricResult } from "../_config";
import { nestMetrics } from "../metrics/clientMetrics";

const CONFIG = config.size;

const Number = new Intl.NumberFormat("en", { style: "decimal" });

const SingleTableStyled = styled.span`
  table {
    width: 90%;
  }
  td,
  th {
    text-align: right;
  }
`;

const TableStyled = styled(ReportTableStyled)`
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
      {(data: MetricResult) => {
        if (Object.keys(data).length === 0)
          throw new Error("Protection results not found");

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
              <p>
                If MPA boundaries overlap with each other, the overlap is only
                counted once when calculating the total size of the network.
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

const genSingleSizeTable = (data: MetricResult) => {
  const classesById = keyBy(CONFIG.classes, (c) => c.classId);
  const singleMetrics = data.metrics.filter(
    (m) => m.sketchId === data.sketch.properties.id
  );
  const aggMetrics = nestMetrics(singleMetrics, ["classId", "metricId"]);
  // Use sketch ID for each table row, index into aggMetrics
  const rows = Object.keys(aggMetrics).map((classId) => ({ classId }));

  const areaColumns: Column<{ classId: string }>[] = [
    {
      Header: " ",
      accessor: (row) => <b>{classesById[row.classId || "missing"].display}</b>,
    },
    {
      Header: "Area Within Plan",
      accessor: (row) => {
        const value = aggMetrics[row.classId].area[0].value;
        return Number.format(Math.round(squareMeterToMile(value))) + " sq. mi.";
      },
    },
    {
      Header: "% Within Plan",
      accessor: (row) =>
        percentWithEdge(aggMetrics[row.classId].areaPerc[0].value),
    },
  ];

  return (
    <SingleTableStyled>
      <Table columns={areaColumns} data={rows} />
    </SingleTableStyled>
  );
};

const genNetworkSizeTable = (data: MetricResult) => {
  const sketches = toNullSketchArray(data.sketch);
  const sketchesById = keyBy(sketches, (sk) => sk.properties.id);
  const sketchIds = sketches.map((sk) => sk.properties.id);
  const sketchMetrics = data.metrics.filter((m) =>
    sketchIds.includes(m.sketchId)
  );
  const aggMetrics = nestMetrics(sketchMetrics, [
    "sketchId",
    "classId",
    "metricId",
  ]);
  // Use sketch ID for each table row, index into aggMetrics
  const rows = Object.keys(aggMetrics).map((sketchId) => ({
    sketchId,
  }));

  const classColumns: Column<{ sketchId: string }>[] = CONFIG.classes.map(
    (curClass, index) => ({
      Header: curClass.display,
      style: { color: "#777" },
      columns: [
        {
          Header: "Area" + " ".repeat(index),
          accessor: (row) => {
            const value =
              aggMetrics[row.sketchId][curClass.classId as string].area[0]
                .value;
            return (
              Number.format(Math.round(squareMeterToMile(value))) + " sq. mi."
            );
          },
        },
        {
          Header: "% Area" + " ".repeat(index),
          accessor: (row) => {
            const value =
              aggMetrics[row.sketchId][curClass.classId as string].areaPerc[0]
                .value;
            return percentWithEdge(value);
          },
        },
      ],
    })
  );

  const columns: Column<any>[] = [
    {
      Header: " ",
      accessor: (row) => <b>{sketchesById[row.sketchId].properties.name}</b>,
    },
    ...classColumns,
  ];

  return (
    <TableStyled>
      <Table columns={columns} data={rows} />
    </TableStyled>
  );
};

export default SizeCard;
