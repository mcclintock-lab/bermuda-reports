import React from "react";
import { percentWithEdge } from "@seasketch/geoprocessing/client-core";
import { Column, Table } from "@seasketch/geoprocessing/client-ui";
import styled from "styled-components";
import { DataClass } from "../metrics/types";
import { SmallReportTableStyled } from "./SmallReportTableStyled";

const SketchClassTableStyled = styled(SmallReportTableStyled)`
  & {
    width: 100%;
    overflow-x: scroll;
  }

  & th:first-child,
  & td:first-child {
    position: sticky;
    left: 0;
    background: #efefef;
  }

  & th,
  & td {
  }

  .styled {
    font-size: 12px;
`;

export interface SketchClassTableProps {
  rows: Record<string, string | number>[];
  classes: DataClass[];
  /** Whether to interpret and format values as percentages, defaults to true */
  usePerc?: boolean;
}

const SketchClassTable: React.FunctionComponent<SketchClassTableProps> = ({
  rows,
  classes,
  usePerc = true,
}) => {
  const classColumns: Column<Record<string, string | number>>[] = classes.map(
    (curClass) => ({
      Header: curClass.display,
      accessor: (row) => {
        return usePerc
          ? percentWithEdge(row[curClass.classId] as number)
          : row[curClass.classId];
      },
    })
  );

  const columns: Column<Record<string, string | number>>[] = [
    {
      Header: "MPA",
      accessor: (row) => {
        return <div style={{ width: 120 }}>{row.sketchName}</div>;
      },
    },
    ...classColumns,
  ];

  return (
    <SketchClassTableStyled>
      <Table
        className="styled"
        columns={columns}
        data={rows.sort((a, b) =>
          (a.sketchName as string).localeCompare(b.sketchName as string)
        )}
      />
    </SketchClassTableStyled>
  );
};

export default SketchClassTable;
