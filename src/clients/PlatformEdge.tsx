import React from "react";
import {
  ResultsCard,
  Skeleton,
  KeySection,
  percentLower,
  LayerToggle,
  useSketchProperties,
  ReportError,
  Table,
  Column,
  capitalize,
} from "@seasketch/geoprocessing/client";
import { GroupCircleRow } from "../components/Circle";
import { GroupMetricAgg, GroupMetricSketchAgg } from "../util/types";
import { Collapse } from "../components/Collapse";
import { getGroupMetricsSketchAgg } from "../util/metrics";
import config, { PlatformEdgeResult, EdgeGroupMetricsSketch } from "../_config";
import styled from "styled-components";

const Percent = new Intl.NumberFormat("en", {
  style: "percent",
  maximumFractionDigits: 1,
});

const LAYERS = config.platformEdge.layers;
const LAYER = LAYERS[0];

const SmallTableStyled = styled.div`
  .squeeze {
    font-size: 13px;

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

const PlatformEdge = () => {
  const [{ isCollection, ...rest }] = useSketchProperties();
  return (
    <ResultsCard
      title="Pelagic Fisheries Access - Platform Edge"
      functionName="platformEdge"
      skeleton={<LoadingSkeleton />}
    >
      {(data: PlatformEdgeResult) => {
        const classMetric = data.byClass[LAYER.baseFilename];
        const totalCount = classMetric.sketchMetrics.length;
        const overlapCount = classMetric.sketchMetrics.reduce(
          (sumSoFar, sm) => (sm.overlap ? sumSoFar + 1 : sumSoFar),
          0
        );

        let keySection: JSX.Element;
        if (isCollection) {
          if (!overlapCount) {
            keySection = (
              <>
                This plan would <b>not</b> create breaks in pelagic fisheries
                access.
              </>
            );
          } else {
            keySection = (
              <>
                This plan <b>would</b> create breaks in pelagic fisheries
                access. <b>{overlapCount}</b> of the <b>{totalCount}</b> MPAs in
                this plan prohibit some type of fishing activity and overlap
                with <b>{percentLower(classMetric.percValue)}</b> of the
                nearshore pelagic fishing zone.
              </>
            );
          }
        } else {
          if (!overlapCount) {
            keySection = (
              <>
                This MPA would <b>not</b> create a break in pelagic fisheries
                access.
              </>
            );
          } else {
            keySection = (
              <>
                This MPA <b>would</b> create a break in pelagic fisheries
                access. At least one fishing activity is prohibited and it
                overlaps with <b>{percentLower(classMetric.percValue)}</b> of
                the nearshore pelagic fishing zone.
              </>
            );
          }
        }

        let groupRows: GroupMetricAgg[] = [];
        let sketchRows: GroupMetricSketchAgg[] = [];
        if (isCollection) {
          // Build agg group objects with percValue for each class
          groupRows = getBreakGroupMetricsAgg(data.byGroup, LAYER.totalArea);

          // Build agg sketch group objects with percValue for each class
          // groupId, sketchId, lagoon, mangrove, seagrass, total
          sketchRows = getGroupMetricsSketchAgg(
            data.byGroup,
            LAYER.totalArea,
            LAYERS
          );
        }

        return (
          <ReportError>
            <p>
              Plans should allow for spatial continuity of fishing for pelagic
              species in depths greater than 55 meters out to 2000 meters
              including the edge of the Bermuda platform and the outlying banks.
            </p>
            <KeySection>{keySection}</KeySection>
            {isCollection && genGroupTable(groupRows)}
            <Collapse title="Learn more">
              <p>
                A <b>break</b> in access is defined as any MPA where at least
                one fishing activity is restricted, that overlaps with the
                55-2000m fishing zone of the platform.
              </p>
              <p>
                If all 4 fishing activities are allowed for an MPA, then it is
                not counted as a break.
                <ul>
                  <li>Traditional fishing/collection</li>
                  <li>Fishing/collection: recreational (sustainable)</li>
                  <li>
                    Fishing/collection: local fishing (sustainable) Industrial
                  </li>
                  <li>Fishing, industrial scale aquaculture</li>
                </ul>
              </p>
            </Collapse>
            <LayerToggle
              label="Show Pelagic Fishing Zone Layer"
              layerId="6164aebea04323106537eb5c"
            />
          </ReportError>
        );
      }}
    </ResultsCard>
  );
};

const genGroupTable = (groupRows: GroupMetricAgg[]) => {
  const classColumns: Column<GroupMetricAgg>[] = LAYERS.map((lyr) => ({
    Header: lyr.display,
    accessor: (row) =>
      row[lyr.baseFilename] === 0
        ? Percent.format(row[lyr.baseFilename] as number)
        : percentLower(row[lyr.baseFilename] as number, {
            lower: 0.001,
            digits: 1,
          }),
  }));

  const breakTextByGroup = (groupId: string, numSketches: number) => {
    const singleOrPlural = numSketches === 1 ? "MPA" : "MPAs";
    const groupMap: Record<string, JSX.Element> = {
      definite: (
        <>
          <b>Definite</b> break {singleOrPlural}{" "}
          <span style={{ color: "#aaa", fontStyle: "italic" }}>
            (3 activities restricted)
          </span>
        </>
      ),
      partial: (
        <>
          <b>Partial</b> break {singleOrPlural}{" "}
          <span style={{ color: "#aaa", fontStyle: "italic" }}>
            (1-2 activities restricted)
          </span>
        </>
      ),
      no: (
        <>
          <b>No</b> break {singleOrPlural}{" "}
          <span style={{ color: "#aaa", fontStyle: "italic" }}>
            (0 actitivites restricted)
          </span>
        </>
      ),
    };
    return groupMap[groupId];
  };

  const columns: Column<GroupMetricAgg>[] = [
    {
      Header: "By Break Type:",
      accessor: (row) => (
        <GroupCircleRow
          group={row.groupId}
          groupColorMap={{
            definite: "#BEE4BE",
            partial: "#FFE1A3",
            no: "#F7A6B4",
          }}
          circleText={`${row.numSketches}`}
          rowText={breakTextByGroup(row.groupId, row.numSketches as number)}
        />
      ),
    },
    {
      Header: "% Fishing Zone Overlap",
      accessor: (row) => percentLower(row.percValue),
      style: { width: "25%" },
    },
  ];

  return (
    <SmallTableStyled>
      <Table className="squeeze" columns={columns} data={groupRows} />
    </SmallTableStyled>
  );
};

/**
 * Build agg group objects with groupId, percValue for each class, and total percValue across classes per group
 */
export const getBreakGroupMetricsAgg = (
  groupData: EdgeGroupMetricsSketch,
  totalValue: number
) => {
  return Object.keys(groupData).map((groupName) => {
    const levelClassMetrics = groupData[groupName];
    const classAgg = Object.keys(levelClassMetrics).reduce(
      (rowSoFar, className) => ({
        ...rowSoFar,
        [className]: levelClassMetrics[className].percValue,
        numSketches: levelClassMetrics[className].sketchMetrics.length,
        value: rowSoFar.value + levelClassMetrics[className].value,
      }),
      { value: 0 }
    );
    return {
      groupId: groupName,
      percValue: classAgg.value / totalValue,
      ...classAgg,
    };
  });
};

const LoadingSkeleton = () => (
  <p>
    <Skeleton style={{}}>&nbsp;</Skeleton>
  </p>
);

export default PlatformEdge;
