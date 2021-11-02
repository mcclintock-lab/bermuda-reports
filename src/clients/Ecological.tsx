import React, { FunctionComponent } from "react";
import KeyNurseryHabitat from "./KeyNurseryHabitat";
import HabitatRepresentation from "./HabitatRepresentation";
import HabitatProtection from "./HabitatProtection";
import HabitatRestoration from "./HabitatRestoration";
import SpeciesProtection from "./SpeciesProtection";

interface ReportProps {
  hidden: boolean;
}

const Report: FunctionComponent<ReportProps> = ({ hidden }) => {
  return (
    <div style={{ display: hidden ? "none" : "block" }}>
      <HabitatProtection />
      <SpeciesProtection />
      <KeyNurseryHabitat />
      <HabitatRepresentation />
      <HabitatRestoration />
    </div>
  );
};

export default Report;
