import React, { FunctionComponent } from "react";
import {
  Card,
  InfoStatus,
  IucnActivitiesCard,
} from "@seasketch/geoprocessing/client-ui";
import SizeCard from "./SizeCard";
import ProtectionCard from "./ProtectionCard";
import ExistingProtections from "./ExistingProtections";
import PriorityModel from "./PriorityModel";

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
      <IucnActivitiesCard />
      <PriorityModel />
    </div>
  );
};

export default Overview;
