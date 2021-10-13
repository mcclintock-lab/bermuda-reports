import React, { FunctionComponent } from "react";
import OceanUse from "./OceanUse";
import PlatformEdge from "./PlatformEdge";

interface ReportProps {
  hidden: boolean;
}

const Report: FunctionComponent<ReportProps> = ({ hidden }) => {
  return (
    <div style={{ display: hidden ? "none" : "block" }}>
      <OceanUse />
      <PlatformEdge />
    </div>
  );
};

export default Report;
