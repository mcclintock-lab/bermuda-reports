import React from "react";
import { ResultsCard, Skeleton } from "@seasketch/geoprocessing/client";
// Import the results type definition from your functions to type-check your
// component render functions
import { AreaResult } from "../functions/area";

const Number = new Intl.NumberFormat("en", { style: "decimal" });

const RenewableEnergy = () => {
  return (
    <>
      <ResultsCard
        title="Renewable Energy"
        functionName="area"
        skeleton={<LoadingSkeleton />}
      >
        {(data: AreaResult) => <p>Work in progress</p>}
      </ResultsCard>
    </>
  );
};

const LoadingSkeleton = () => (
  <p>
    <Skeleton style={{}}>&nbsp;</Skeleton>
  </p>
);

export default RenewableEnergy;
