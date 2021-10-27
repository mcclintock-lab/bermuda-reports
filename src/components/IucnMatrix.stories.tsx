import React from "react";
import { IucnMatrix } from "./IucnMatrix";
import { Card, ReportDecorator } from "@seasketch/geoprocessing/client";

export default {
  component: IucnMatrix,
  title: "Components/IucnMatrix",
  decorators: [ReportDecorator],
};

export const simple = () => (
  <Card>
    <IucnMatrix />
  </Card>
);
