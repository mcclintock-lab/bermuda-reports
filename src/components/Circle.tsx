import React, { ReactNode } from "react";
import styled from "styled-components";

const StyledCircle = styled.div`
  background-color: ${(props) => (props.color ? props.color : "#DDD")};
  border-radius: 18px;
  padding: 3px 5px;
  min-width: 17px;
  height: 21px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export interface CircleProps {
  children: ReactNode;
  color?: string;
}

export const Circle: React.FunctionComponent<CircleProps> = ({
  children,
  color,
}) => {
  return <StyledCircle color={color}>{children}</StyledCircle>;
};

export interface LevelCircleProps {
  children: ReactNode;
  level: string;
}

export const LevelCircle: React.FunctionComponent<LevelCircleProps> = ({
  level,
  children,
}) => {
  return (
    <Circle
      color={
        level === "full" ? "#BEE4BE" : level === "high" ? "#FFE1A3" : "#F7A6B4"
      }
    >
      {children}
    </Circle>
  );
};

export interface LevelCircleRowProps {
  level: string;
  circleText?: string | number;
  rowText?: string | ReactNode;
}

export const LevelCircleRow: React.FunctionComponent<LevelCircleRowProps> = ({
  level,
  circleText,
  rowText,
}) => {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <LevelCircle level={level}>{circleText || " "}</LevelCircle>
      <span style={{ marginLeft: 5 }}>{rowText || ""}</span>
    </div>
  );
};

//// GROUP CIRCLE ////

export interface GroupCircleProps {
  children: ReactNode;
  group: string;
  groupColorMap: Record<string, string>;
}

/**
 * Circle with colors assigned to each group name
 */
export const GroupCircle: React.FunctionComponent<GroupCircleProps> = ({
  children,
  group,
  groupColorMap,
}) => {
  return <Circle color={groupColorMap[group]}>{children}</Circle>;
};

export interface GroupCircleRowProps {
  group: string;
  groupColorMap: Record<string, string>;
  circleText?: string | number;
  rowText?: string | ReactNode;
}

/**
 * GroupCircle with layout for table row, with colors assigned to each group name
 */
export const GroupCircleRow: React.FunctionComponent<GroupCircleRowProps> = ({
  group,
  groupColorMap,
  circleText,
  rowText,
}) => {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <GroupCircle group={group} groupColorMap={groupColorMap}>
        {circleText || " "}
      </GroupCircle>
      <span style={{ marginLeft: 5 }}>{rowText || ""}</span>
    </div>
  );
};
