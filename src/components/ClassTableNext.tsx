import React from "react";
import {
  Column,
  Table,
  percentWithEdge,
  keyBy,
  LayerToggle,
} from "@seasketch/geoprocessing/client";
import { GreenPill } from "../components/Pill";
import {
  DataClass,
  ExtendedMetric,
  ExtendedSketchMetric,
} from "../metrics/types";
import { ReportTableStyled } from "./ReportTableStyled";

export interface ClassTableProps {
  titleText: string;
  percText?: string;
  rows: ExtendedMetric[] | ExtendedSketchMetric[];
  classes: DataClass[];
  showGoal?: boolean;
  options?: {
    classColWidth?: string;
    percColWidth?: string;
    showMapWidth?: string;
    goalWidth?: string;
  };
}

export const ClassTable: React.FunctionComponent<ClassTableProps> = ({
  titleText,
  percText = "% Within Plan",
  rows,
  classes,
  showGoal = false,
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
  const classesByName = keyBy(classes, (curClass) => curClass.name);
  const columns: Column<ExtendedMetric>[] = [
    {
      Header: titleText,
      accessor: (row) =>
        classesByName[row.classId || "missing"]?.display || "missing",
      style: { width: colWidths.classColWidth },
    },
    {
      Header: percText,
      style: { textAlign: "right", width: colWidths.percColWidth },
      accessor: (row) => {
        const percDisplay = percentWithEdge(row.value);
        const goal =
          classes.find((curClass) => curClass.name === row.classId)?.goalPerc ||
          0;
        if (showGoal && row.value > goal) {
          return <GreenPill>{percDisplay}</GreenPill>;
        } else {
          return percDisplay;
        }
      },
    },
    {
      Header: "Show Map",
      accessor: (row) => {
        const layerId = classesByName[row.classId || "missing"].layerId;
        return layerId ? (
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
        const goalPerc = classes.find(
          (curClass) => curClass.name === row.classId
        )?.goalPerc;
        return percentWithEdge(goalPerc || 0);
      },
    });
  }

  return (
    <ReportTableStyled>
      <Table className="styled" columns={columns} data={rows} />
    </ReportTableStyled>
  );
};
