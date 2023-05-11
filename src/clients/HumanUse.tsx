import React, { FunctionComponent } from "react";
import OceanUseBySector from "./OceanUseBySector";
import OceanUseByGearType from "./OceanUseByGearType";
import PlatformEdge from "./PlatformEdge";
import Shipwreck from "./Shipwreck";

interface ReportProps {
  hidden: boolean;
}

const Report: FunctionComponent<ReportProps> = ({ hidden }) => {
  return (
    <div style={{ display: hidden ? "none" : "block" }}>
      <OceanUseBySector />
      <OceanUseByGearType />
      <PlatformEdge />
      <Shipwreck />
    </div>
  );
};

export default Report;
