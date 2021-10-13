import React, { ReactNode } from "react";
import styled from "styled-components";

const StyledPill = styled.span`
  background-color: ${(props) => (props.color ? props.color : "#CCC")};
  border-radius: 6px;
  padding: 3px 5px;
`;

export interface PillProps {
  children: ReactNode;
  color?: string;
}

export const Pill: React.FunctionComponent<PillProps> = ({
  children,
  color,
}) => {
  return <StyledPill color={color}>{children}</StyledPill>;
};

export interface PillColumnProps {
  children: ReactNode;
}

export const PillColumn: React.FunctionComponent<PillColumnProps> = ({
  children,
}) => {
  return (
    <span style={{ display: "flex" }}>
      {children}
      <span style={{ flex: 1 }}></span>
    </span>
  );
};

export interface LevelPillProps {
  level: string;
  children: ReactNode;
}

export const LevelPill: React.FunctionComponent<LevelPillProps> = ({
  level,
  children,
}) => {
  return (
    <Pill
      color={
        level === "full" ? "#BEE4BE" : level === "high" ? "#FFE1A3" : "#F7A6B4"
      }
    >
      {children}
    </Pill>
  );
};
