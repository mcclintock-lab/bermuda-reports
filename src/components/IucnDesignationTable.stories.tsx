import React from "react";
import { IucnDesignationTable } from "./IucnDesignationTable";
import { Card, ReportDecorator } from "@seasketch/geoprocessing/client";

export default {
  component: IucnDesignationTable,
  title: "Components/IucnDesignationTable",
  decorators: [ReportDecorator],
};

export const simple = () => (
  <Card>
    <IucnDesignationTable />
  </Card>
);
