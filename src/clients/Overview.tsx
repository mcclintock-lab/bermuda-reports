import React, { FunctionComponent } from "react";
import { Card } from "@seasketch/geoprocessing/client-ui";
import { InfoStatus } from "../components/InfoStatus";
import SizeCard from "./SizeCard";
import ProtectionCard from "./ProtectionCard";
import ExistingProtections from "./ExistingProtections";
import AttributesCard from "./AttributesCard";

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
              updates/corrections via SeaSketch forum post and email.
            </span>
          }
        />
      </Card>
      <SizeCard />
      <ProtectionCard />
      <ExistingProtections />
      <AttributesCard />
    </div>
  );
};

export default Overview;
