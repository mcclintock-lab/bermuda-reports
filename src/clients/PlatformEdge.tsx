import React from "react";
import {
  percentWithEdge,
  capitalize,
  toNullSketchArray,
  keyBy,
  isSketchCollection,
  NullSketch,
} from "@seasketch/geoprocessing/client-core";
import {
  ResultsCard,
  Skeleton,
  KeySection,
  LayerToggle,
  useSketchProperties,
  ReportError,
  Table,
  Column,
} from "@seasketch/geoprocessing/client-ui";
import { getBreakGroup } from "../util/getBreakGroup";
import { GroupCircleRow } from "../components/Circle";
import {
  ExtendedSketchMetric,
  GroupMetricAgg,
  GroupMetricSketchAgg,
} from "../metrics/types";
import { Collapse } from "../components/Collapse";
import {
  firstMatchingMetric,
  flattenByGroup,
  flattenByGroupSketch,
  metricsForSketch,
} from "../metrics/clientMetrics";
import config, {
  ReportResultBase,
  ReportResult,
  EdgeSketchMetric,
} from "../_config";
import { SmallReportTableStyled } from "../components/SmallReportTableStyled";
import { sketchMetricPercent } from "../metrics/clientMetrics";

import platformEdgeTotals from "../../data/precalc/platformEdgeTotals.json";
const precalcTotals = platformEdgeTotals as ReportResultBase;

const CLASS = config.platformEdge.classes[0];
const BREAK_MAP = config.platformEdge.breakMap;

const isEdgeSketchMetric = (
  metric: ExtendedSketchMetric
): metric is EdgeSketchMetric =>
  !!metric?.extra?.numFishingRestricted && !!metric?.extra?.overlapEdge;

const toEdgeSketchMetric = (metric: ExtendedSketchMetric): EdgeSketchMetric => {
  if (
    metric?.extra?.numFishingRestricted !== undefined &&
    metric?.extra?.overlapEdge !== undefined
  ) {
    return metric as EdgeSketchMetric;
  } else {
    throw new Error("Not an EdgeSketchmetric");
  }
};

const PlatformEdge = () => {
  const [{ isCollection, ...rest }] = useSketchProperties();
  return (
    <ResultsCard
      title="Pelagic Fisheries Access - Platform Edge"
      functionName="platformEdge"
      skeleton={<LoadingSkeleton />}
    >
      {(data: ReportResult) => {
        const sketches = toNullSketchArray(data.sketch);
        const sketchesById = keyBy(sketches, (sk) => sk.properties.id);

        // Build class percent metrics (non-group)
        const classPercMetrics = sketchMetricPercent(
          data.metrics.filter((m) => !m.groupId && m.classId === CLASS.classId),
          precalcTotals.metrics
        );
        const classPercMetric = firstMatchingMetric(
          classPercMetrics,
          (m) =>
            m.sketchId === data.sketch.properties.id &&
            m.classId === CLASS.classId
        );

        const singleClassMetrics = metricsForSketch(
          data.metrics,
          sketches
        ).filter((m) => !m.groupId);
        const singleClassEdgeMetrics = singleClassMetrics.map((smp) =>
          toEdgeSketchMetric(smp)
        );

        // Count total number of sketches with overlap
        const overlapCount = singleClassEdgeMetrics.reduce(
          (sumSoFar, sm) => (sm?.extra?.overlapEdge ? sumSoFar + 1 : sumSoFar),
          0
        );

        // Create map of groupId => overlap count for group
        const numGroupsMap = singleClassEdgeMetrics.reduce<
          Record<string, number>
        >((soFar, sm) => {
          const breakGroup = getBreakGroup(
            BREAK_MAP,
            sm.extra.numFishingRestricted,
            sm.extra.overlapEdge
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
                <b>{percentWithEdge(classPercMetric.value)}</b> of the nearshore
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
                <b>{classPercMetric?.extra?.numFishingRestricted}</b> fishing
                activities are restricted and it overlaps with{" "}
                <b>{percentWithEdge(classPercMetric.value)}</b> of the nearshore
                pelagic fishing zone.
              </>
            );
          }
        }

        let groupRows: GroupMetricAgg[] = [];
        let sketchRows: GroupMetricSketchAgg[] = [];
        if (isCollection && isSketchCollection(data.sketch)) {
          const groupMetrics = data.metrics.filter((m) => m.groupId);

          // Build agg group objects with percValue for each class
          groupRows = flattenByGroup(
            data.sketch,
            groupMetrics,
            precalcTotals.metrics
          );

          // Build agg sketch group objects with percValue for each class
          // groupId, sketchId, class1, class2, ..., total
          sketchRows = flattenByGroupSketch(
            sketches,
            groupMetrics,
            precalcTotals.metrics
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
                  {genSketchTable(sketchesById, sketchRows)}
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

const genSketchTable = (
  sketchesById: Record<string, NullSketch>,
  sketchRows: GroupMetricSketchAgg[]
) => {
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
          rowText={sketchesById[row.sketchId].properties.name}
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

const LoadingSkeleton = () => (
  <p>
    <Skeleton style={{}}>&nbsp;</Skeleton>
  </p>
);

export default PlatformEdge;
