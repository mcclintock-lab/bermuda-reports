import React from "react";
import {
  Column,
  Table,
  percentWithEdge,
} from "@seasketch/geoprocessing/client";
import styled from "styled-components";
import { DataClass } from "../metrics/types";
import { SmallReportTableStyled } from "./SmallReportTableStyled";

const SmallTableStyled = styled.div`
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

  .squeeze {
    font-size: 12px;

    td,
    th {
      padding: 5px 5px;
    }

    td:last-child,
    th:last-child {
      text-align: right;
    }
  }
`;

export interface SketchClassTableProps {
  rows: Record<string, string | number>[];
  classes: DataClass[];
}

const SketchClassTable: React.FunctionComponent<SketchClassTableProps> = ({
  rows,
  classes,
}) => {
  const classColumns: Column<Record<string, string | number>>[] = classes.map(
    (curClass) => ({
      Header: curClass.display,
      accessor: (row) => {
        return percentWithEdge(row[curClass.classId] as number);
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
    <SmallReportTableStyled>
      <Table
        className="styled"
        columns={columns}
        data={rows.sort((a, b) =>
          (a.sketchName as string).localeCompare(b.sketchName as string)
        )}
      />
    </SmallReportTableStyled>
  );
};

export default SketchClassTable;
