import React from "react";
import { SketchAttributesCard } from "@seasketch/geoprocessing/client";
import { iucnActivities } from "../util/iucnProtectionLevel";

const AttributesCard = () => {
  const actMapping = Object.values(iucnActivities)
    .map((act) => ({ [act.id]: act.display }))
    .reduce((actMapSoFar, oneActMap) => ({ ...actMapSoFar, ...oneActMap }), {});
  const mappings = {
    ACTIVITIES: {
      ...actMapping,
    },
  };

  return <SketchAttributesCard autoHide={true} mappings={mappings} />;
};

export default AttributesCard;
