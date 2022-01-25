import React, { useState } from "react";
import { SegmentControl } from "@seasketch/geoprocessing/client-ui";
import Overview from "./Overview";
import HumanUse from "./HumanUse";
import Energy from "./Energy";
import Ecological from "./Ecological";

const enableAllTabs = false;
const AllReports = () => {
  const [tab, setTab] = useState<string>("Overview");
  return (
    <>
      <div style={{ marginTop: 5 }}>
        <SegmentControl
          value={tab}
          onClick={(segment) => setTab(segment)}
          segments={["Overview", "Ecological", "Human Use", "Energy"]}
        />
      </div>
      <Overview hidden={!enableAllTabs && tab !== "Overview"} />
      <Ecological hidden={!enableAllTabs && tab !== "Ecological"} />
      <HumanUse hidden={!enableAllTabs && tab !== "Human Use"} />
      <Energy hidden={!enableAllTabs && tab !== "Energy"} />
    </>
  );
};

export default AllReports;
