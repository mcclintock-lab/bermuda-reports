import React from "react";
import { percentWithEdge, keyBy } from "@seasketch/geoprocessing/client-core";
import { Column, Table, LayerToggle } from "@seasketch/geoprocessing/client-ui";
import { GreenPill } from "./Pill";
import { DataClass, ClassMetric, ClassMetricSketch } from "../metrics/types";
import { ReportTableStyled } from "./ReportTableStyled";

export interface CategoricalClassTableProps {
  titleText: string;
  layerId?: string;
  rows: ClassMetric[] | ClassMetricSketch[];
  classes: DataClass[];
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
    (curClass) => curClass.classId || "unknown"
  );
  const columns: Column<ClassMetric>[] = [
    {
      Header: titleText,
      accessor: (row) => classesByName[row.name].classId,
      style: { width: colWidths.classColWidth },
    },
    {
      Header: "% Within Plan",
      style: { textAlign: "right", width: colWidths.percColWidth },
      accessor: (row) => {
        const percDisplay = percentWithEdge(row.percValue);
        const goal =
          classes.find((curClass) => curClass.classId === row.name)?.goalPerc ||
          0;
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
        const goalPerc = classes.find(
          (curClass) => curClass.classId === row.name
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
