import React, { FunctionComponent } from "react";
import KeyNurseryHabitat from "./KeyNurseryHabitat";
import HabitatProtectionNearshore from "./HabitatProtectionNearshore";
import HabitatProtectionOffshore from "./HabitatProtectionOffshore";
import HabitatRestoration from "./HabitatRestoration";
import SpeciesProtection from "./SpeciesProtection";

interface ReportProps {
  hidden: boolean;
}

const Report: FunctionComponent<ReportProps> = ({ hidden }) => {
  return (
    <div style={{ display: hidden ? "none" : "block" }}>
      <HabitatProtectionNearshore />
      <HabitatProtectionOffshore />
      <SpeciesProtection />
      <KeyNurseryHabitat />
      <HabitatRestoration />
    </div>
  );
};

export default Report;
