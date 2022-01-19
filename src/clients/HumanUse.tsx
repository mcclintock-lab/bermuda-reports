import React, { FunctionComponent } from "react";
import OceanUse from "./OceanUse";
import PlatformEdge from "./PlatformEdge";
import Shipwreck from "./Shipwreck";

interface ReportProps {
  hidden: boolean;
}

const Report: FunctionComponent<ReportProps> = ({ hidden }) => {
  return (
    <div style={{ display: hidden ? "none" : "block" }}>
      <OceanUse />
      <PlatformEdge />
      <Shipwreck />
    </div>
  );
};

export default Report;
