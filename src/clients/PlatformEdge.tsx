import React from "react";
import {
  ResultsCard,
  Skeleton,
  KeySection,
  percentLower,
  LayerToggle,
} from "@seasketch/geoprocessing/client";
import { Collapse } from "../components/Collapse";
// Import the results type definition from your functions to type-check your
// component render functions
import { PlatformEdgeResult } from "../functions/platformEdge";

const Number = new Intl.NumberFormat("en", { style: "decimal" });

const PlatformEdge = () => (
  <ResultsCard
    title="Pelagic Fisheries Access - Platform Edge"
    functionName="platformEdge"
    skeleton={<LoadingSkeleton />}
  >
    {(dataz: PlatformEdgeResult) => {
      const data = {
        edge: {
          percArea: 0.0542,
          overlapCount: 4,
        },
      };
      return (
        <>
          <p>
            Plans should allow for spatial continuity of fishing for pelagic
            species in depths {">"} 55 meters out to 2000 meters including the
            edge of the Bermuda platform and the outlying banks.
          </p>
          <KeySection>
            This plan overlaps with <b>{percentLower(data.edge.percArea)}</b> of
            the platform edge, creating <b>{data.edge.overlapCount}</b> break
            {data.edge.overlapCount > 1 ? "s" : ""}
          </KeySection>
          <LayerToggle
            label="Show Pelagic Fishing Zone Layer"
            layerId="6164aebea04323106537eb5c"
          />
          <Collapse title="Learn more">
            <p>
              A break is classed as any MPA area where fishing is not allowed,
              that overlaps with the 55-2000m area of the platform.
            </p>
          </Collapse>
        </>
      );
    }}
  </ResultsCard>
);

const LoadingSkeleton = () => (
  <p>
    <Skeleton style={{}}>&nbsp;</Skeleton>
  </p>
);

export default PlatformEdge;
