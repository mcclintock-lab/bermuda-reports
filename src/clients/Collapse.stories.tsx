import React from "react";
import { Collapse } from "../components/Collapse";
import { ReportDecorator, Card } from "@seasketch/geoprocessing/client";

export default {
  component: Collapse,
  title: "Components/Collapse",
  decorators: [ReportDecorator],
};

export const text = () => (
  <Card title="Card Title">
    <Collapse title="Learn More">Help text here</Collapse>
  </Card>
);
