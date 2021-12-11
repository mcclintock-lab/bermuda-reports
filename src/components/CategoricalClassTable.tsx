import React from "react";
import {
  Column,
  Table,
  percentWithEdge,
  keyBy,
  LayerToggle,
} from "@seasketch/geoprocessing/client";
import styled from "styled-components";
import { GreenPill } from "./Pill";
import { ClassConfig, ClassMetric, ClassMetricSketch } from "../util/types";

const TableStyled = styled.div`
  .styled {
    td {
      padding: 5px 5px;
    }
  }
}
`;

export interface CategoricalClassTableProps {
  titleText: string;
  layerId: string;
  rows: ClassMetric[] | ClassMetricSketch[];
  classes: ClassConfig[];
  showGoal: boolean;
  options?: {
    classColWidth?: string;
    percColWidth?: string;
    showMapWidth?: string;
    goalWidth?: string;
  };
}

export const CategoricalClassTable: React.FunctionComponent<CategoricalClassTableProps> = ({
  titleText,
  layerId,
  rows,
  classes,
  showGoal = true,
  options,
}) => {
  // Use user-defined width, otherwise sane default depending on whether goal
  const colWidths = {
    classColWidth: options?.classColWidth
      ? options?.classColWidth
      : showGoal
      ? "30%"
      : "50%",
    percColWidth: options?.percColWidth
      ? options?.percColWidth
      : showGoal
      ? "30%"
      : "30%",
    showMapWidth: options?.showMapWidth
      ? options?.showMapWidth
      : showGoal
      ? "20%"
      : "20%",
    goalWidth: options?.goalWidth
      ? options?.goalWidth
      : showGoal
      ? "20%"
      : "50%",
  };
  const classesByName = keyBy(
    classes,
    (curClass) => curClass.name || "unknown"
  );
  const columns: Column<ClassMetric>[] = [
    {
      Header: titleText,
      accessor: (row) => classesByName[row.name].name,
      style: { width: colWidths.classColWidth },
    },
    {
      Header: "% Within Plan",
      style: { textAlign: "right", width: colWidths.percColWidth },
      accessor: (row) => {
        const percDisplay = percentWithEdge(row.percValue);
        const goal =
          classes.find((curClass) => curClass.name === row.name)?.goalPerc || 0;
        if (row.percValue > goal) {
          return <GreenPill>{percDisplay}</GreenPill>;
        } else {
          return percDisplay;
        }
      },
    },
    {
      Header: "Show Map",
      accessor: (row, index) => {
        return index == 0 ? (
          <LayerToggle
            simple
            layerId={layerId}
            style={{ marginTop: 0, marginLeft: 15 }}
          />
        ) : (
          <></>
        );
      },
      style: { width: colWidths.showMapWidth },
    },
  ];

  // Optionally insert goal column
  if (showGoal) {
    columns.splice(columns.length - 1, 0, {
      Header: "Goal",
      style: { textAlign: "right", width: colWidths.goalWidth },
      accessor: (row) => {
        const goalPerc = classes.find((curClass) => curClass.name === row.name)
          ?.goalPerc;
        return percentWithEdge(goalPerc || 0);
      },
    });
  }

  return (
    <TableStyled>
      <Table className="styled" columns={columns} data={rows} />
    </TableStyled>
  );
};
