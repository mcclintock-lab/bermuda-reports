import React, { FunctionComponent } from "react";
import { SketchAttributesCard } from "@seasketch/geoprocessing/client";
import SizeCard from "./SizeCard";
import ProtectionCard from "./ProtectionCard";
import ExistingProtections from "./ExistingProtections";

interface ReportProps {
  hidden: boolean;
}

const Overview: FunctionComponent<ReportProps> = ({ hidden }) => {
  return (
    <div style={{ display: hidden ? "none" : "block" }}>
      <SizeCard />
      <ProtectionCard />
      <ExistingProtections />
      <SketchAttributesCard autoHide={true} />
    </div>
  );
};

export default Overview;
