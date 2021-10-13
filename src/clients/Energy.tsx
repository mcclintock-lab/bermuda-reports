import React, { FunctionComponent } from "react";
import RenewableEnergy from "./RenewableEnergy";

interface ReportProps {
  hidden: boolean;
}

const Report: FunctionComponent<ReportProps> = ({ hidden }) => {
  return (
    <div style={{ display: hidden ? "none" : "block" }}>
      <RenewableEnergy />
    </div>
  );
};

export default Report;
