import React from "react";
import {
  ResultsCard,
  Skeleton,
  KeySection,
  percentWithEdge,
  LayerToggle,
  useSketchProperties,
  ReportError,
  Table,
  Column,
  capitalize,
} from "@seasketch/geoprocessing/client";
import { GroupCircleRow } from "../components/Circle";
import { GroupMetricAgg, GroupMetricSketchAgg } from "../metrics/types";
import { Collapse } from "../components/Collapse";
import { flattenGroupSketch } from "../metrics/clientMetrics";
import config, { PlatformEdgeResult, EdgeGroupMetricsSketch } from "../_config";
import { getBreakGroup } from "../util/getBreakGroup";
import platformEdgeTotals from "../../data/precalc/platformEdgeTotals.json";
import { SmallReportTableStyled } from "../components/SmallReportTableStyled";

const precalcTotals = platformEdgeTotals as Record<string, number>;

const CLASSES = config.platformEdge.classes;
const CLASS = CLASSES[0];
const BREAK_MAP = config.platformEdge.breakMap;

const PlatformEdge = () => {
  const [{ isCollection, ...rest }] = useSketchProperties();
  return (
    <ResultsCard
      title="Pelagic Fisheries Access - Platform Edge"
      functionName="platformEdge"
      skeleton={<LoadingSkeleton />}
    >
      {(data: PlatformEdgeResult) => {
        const classMetric = data.byClass[CLASS.classId];

        // Get aggregate sketch metric stats
        const totalCount = classMetric.sketchMetrics.length;
        const overlapCount = classMetric.sketchMetrics.reduce(
          (sumSoFar, sm) => (sm.overlap ? sumSoFar + 1 : sumSoFar),
          0
        );
        // get map of [groupName] => group name count
        const numGroupsMap = classMetric.sketchMetrics.reduce<
          Record<string, number>
        >((soFar, sm) => {
          const breakGroup = getBreakGroup(
            BREAK_MAP,
            sm.numFishingRestricted,
            sm.overlap
          );
          return {
            ...soFar,
            [breakGroup]: soFar[breakGroup] ? soFar[breakGroup] + 1 : 1,
          };
        }, {});

        const highestGroup = Object.keys(numGroupsMap).find(
          (groupName) => numGroupsMap[groupName] > 0
        );
        if (!highestGroup) throw new Error("No highest group map");

        let keySection: JSX.Element;
        if (isCollection) {
          keySection = (
            <>
              This plan would create <b>{overlapCount}</b> breaks in pelagic
              fisheries access.
            </>
          );
          if (highestGroup !== "no") {
            keySection = (
              <>
                {keySection} It overlaps with{" "}
                <b>{percentWithEdge(classMetric.percValue)}</b> of the nearshore
                pelagic fishing zone.
              </>
            );
          }
        } else {
          keySection = (
            <>
              This MPA would create {highestGroup !== "no" ? " a " : ""}{" "}
              <b>{highestGroup}</b> break in pelagic fisheries access.
            </>
          );
          if (highestGroup !== "no") {
            keySection = (
              <>
                {keySection}{" "}
                <b>{classMetric.sketchMetrics[0].numFishingRestricted}</b>{" "}
                fishing activities are restricted and it overlaps with{" "}
                <b>{percentWithEdge(classMetric.percValue)}</b> of the nearshore
                pelagic fishing zone.
              </>
            );
          }
        }

        let groupRows: GroupMetricAgg[] = [];
        let sketchRows: GroupMetricSketchAgg[] = [];
        if (isCollection) {
          // Build agg group objects with percValue for each class
          groupRows = getBreakGroupMetricsAgg(
            data.byGroup,
            precalcTotals[CLASS.classId]
          );

          // Build agg sketch group objects with percValue for each class
          // groupId, sketchId, lagoon, mangrove, seagrass, total
          sketchRows = flattenGroupSketch(
            data.byGroup,
            precalcTotals[CLASS.classId],
            CLASSES
          );
        }

        return (
          <ReportError>
            <p>
              Plans should allow for spatial continuity of fishing for pelagic
              species in the Nearshore Pelagic Fisheries Zone, defined as depths
              greater than 55 meters out to 2000 meters including the edge of
              the Bermuda platform and the outlying banks.
            </p>
            <KeySection>{keySection}</KeySection>
            {isCollection && genGroupTable(groupRows)}
            {isCollection && (
              <>
                <Collapse title="Show by MPA">
                  {genSketchTable(sketchRows)}
                </Collapse>
              </>
            )}
            <Collapse title="Learn more">
              <p>
                A <b>break</b> in access is defined as any MPA where at least
                one fishing activity is restricted, and the boundary overlaps
                with the 55-2000m fishing zone of the platform.
              </p>
              <p>
                Fishing activities that breaks are assessed for include:
                <ul>
                  <li>Fishing/collection: recreational (sustainable)</li>
                  <li>
                    Fishing/collection: local fishing (sustainable) Industrial
                  </li>
                  <li>Fishing, industrial scale aquaculture</li>
                </ul>
                Fishing activities that breaks are not assessed for include:
                <ul>
                  <li>Traditional fishing/collection</li>
                </ul>
              </p>

              <p>
                Breaks are further broken down into 3 levels:
                <ul>
                  <li>
                    <b>Definite</b> break: all 3 fishing activities restricted
                  </li>
                  <li>
                    <b>Partial</b> break: 1-2 fishing activities restricted
                  </li>
                  <li>
                    <b>No</b> break: 0 fishing activities restricted
                  </li>
                </ul>
              </p>
              <p>
                In addition, if MPA boundaries within a given break category
                overlap with each other, the overlap is only counted once
                towards % fishing zone overlap. If overlapping MPAs fall under
                different break types, the higher break type applies and the
                overlap is counted under it.
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
  const breakTextByGroup = (groupId: string, numSketches: number) => {
    const singleOrPlural = numSketches === 1 ? "MPA" : "MPAs";
    const groupMap: Record<string, JSX.Element> = {
      definite: (
        <>
          <b>Definite</b> break {singleOrPlural}{" "}
          <span
            style={{
              color: "#aaa",
              fontStyle: "italic",
              fontSize: "11px",
              paddingLeft: 10,
            }}
          >
            (3 fishing activities restricted)
          </span>
        </>
      ),
      partial: (
        <>
          <b>Partial</b> break {singleOrPlural}{" "}
          <span
            style={{
              color: "#aaa",
              fontStyle: "italic",
              fontSize: "11px",
              paddingLeft: 10,
            }}
          >
            (1-2 fishing activities restricted)
          </span>
        </>
      ),
      no: (
        <>
          <b>No</b> break {singleOrPlural}{" "}
          <span
            style={{
              color: "#aaa",
              fontStyle: "italic",
              fontSize: "11px",
              paddingLeft: 10,
            }}
          >
            (0 overlap or fishing restricted)
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
            definite: "#F7A6B4",
            partial: "#FFE1A3",
            no: "#BEE4BE",
          }}
          circleText={`${row.numSketches}`}
          rowText={breakTextByGroup(row.groupId, row.numSketches as number)}
        />
      ),
    },
    {
      Header: "% Fishing Zone Overlap",
      accessor: (row) => percentWithEdge(row.percValue),
      style: { width: "25%" },
    },
  ];

  return (
    <SmallReportTableStyled>
      <Table className="styled" columns={columns} data={groupRows} />
    </SmallReportTableStyled>
  );
};

const genSketchTable = (sketchRows: GroupMetricSketchAgg[]) => {
  const columns: Column<GroupMetricSketchAgg>[] = [
    {
      Header: "MPA:",
      accessor: (row) => (
        <GroupCircleRow
          group={row.groupId}
          groupColorMap={{
            definite: "#F7A6B4",
            partial: "#FFE1A3",
            no: "#BEE4BE",
          }}
          rowText={row.sketchName}
        />
      ),
    },
    {
      Header: "Break Type",
      accessor: (row) => capitalize(row.groupId),
      style: { width: "20%" },
    },
    {
      Header: "% Fishing Zone Overlap",
      accessor: (row) => percentWithEdge(row.percValue),
      style: { width: "25%" },
    },
  ];

  return (
    <SmallReportTableStyled>
      <Table className="styled" columns={columns} data={sketchRows} />
    </SmallReportTableStyled>
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
