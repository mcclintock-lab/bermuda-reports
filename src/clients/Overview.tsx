import React, { FunctionComponent } from "react";
import { SketchAttributesCard, Card } from "@seasketch/geoprocessing/client";
import SizeCard from "./SizeCard";
import ProtectionCard from "./ProtectionCard";
import ExistingProtections from "./ExistingProtections";
import { InfoStatus } from "../components/InfoStatus";

interface ReportProps {
  hidden: boolean;
}

const Overview: FunctionComponent<ReportProps> = ({ hidden }) => {
  return (
    <div style={{ display: hidden ? "none" : "block" }}>
      <Card>
        <InfoStatus
          size={32}
          msg={
            <span>
              These are <b>draft</b> reports. Users will be notified of
              significant changes via SeaSketch forums post for which users
              should receive an email. Direct all report questions, requests and
              feedback to PERSON@gmail.com
            </span>
          }
        />
      </Card>
      <SizeCard />
      <ProtectionCard />
      <ExistingProtections />
      <SketchAttributesCard autoHide={true} />
    </div>
  );
};

export default Overview;
