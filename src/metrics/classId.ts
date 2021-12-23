import { DataGroup } from "./types";

export const groupClassIdMapping = (dataGroup: DataGroup) => {
  return dataGroup.classes.reduce<Record<string, string>>(
    (acc, curClass) => ({
      ...acc,
      ...(curClass.numericClassId
        ? { [curClass.numericClassId]: curClass.classId }
        : {}),
    }),
    {}
  );
};
