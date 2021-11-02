import React from "react";
import {
  ResultsCard,
  Skeleton,
  KeySection,
  percentLower,
  LayerToggle,
  useSketchProperties,
} from "@seasketch/geoprocessing/client";
import { Collapse } from "../components/Collapse";
// Import the results type definition from your functions to type-check your
// component render functions
import { PlatformEdgeResult } from "../functions/platformEdge";

const PlatformEdge = () => {
  const [{ isCollection, ...rest }] = useSketchProperties();
  return (
    <ResultsCard
      title="Pelagic Fisheries Access - Platform Edge"
      functionName="platformEdge"
      skeleton={<LoadingSkeleton />}
    >
      {(data: PlatformEdgeResult) => {
        const breaks = data.edge.overlapCount;
        let keySection: JSX.Element;
        if (isCollection) {
          if (!breaks) {
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
                access. <b>{data.edge.overlapCount}</b> of the{" "}
                <b>{data.edge.totalCount}</b> MPAs in this plan are completely
                no-take and overlap with{" "}
                <b>{percentLower(data.edge.percArea)}</b> of the nearshore
                pelagic fishing zone.
              </>
            );
          }
        } else {
          if (!breaks) {
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
                access. Fishing is not allowed (no-take) and it overlaps with{" "}
                <b>{percentLower(data.edge.percArea)}</b> of the nearshore
                pelagic fishing zone.
              </>
            );
          }
        }

        return (
          <>
            <p>
              Plans should allow for spatial continuity of fishing for pelagic
              species in depths {">"} 55 meters out to 2000 meters including the
              edge of the Bermuda platform and the outlying banks.
            </p>
            <KeySection>{keySection}</KeySection>
            <Collapse title="Learn more">
              <p>
                A break is classed as any MPA where fishing is not allowed (no
                fishing activities), that overlaps with the 55-2000m area of the
                platform.
              </p>
              <p>
                If at least one of the 4 fishing activities are allowed for an
                MPA, then it is not counted as a break.
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
          </>
        );
      }}
    </ResultsCard>
  );
};

const LoadingSkeleton = () => (
  <p>
    <Skeleton style={{}}>&nbsp;</Skeleton>
  </p>
);

export default PlatformEdge;
