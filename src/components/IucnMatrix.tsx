import React from "react";
import {
  iucnActivities,
  activityRanks,
  iucnActivityCategories,
  iucnCategoriesList,
  fullColor,
  highColor,
} from "../util/iucnProtectionLevel";
import styled from "styled-components";

const MatrixStyled = styled.div`
  td,
  th {
    padding: 5px 6px;
  }
  tr > :nth-child(n + 2) {
    text-align: center;
  }
  td {
    border: 1px solid #999;
  }
  table {
    border-collapse: collapse;
  }

  .full {
    background-color: ${fullColor};
  }

  .high {
    background-color: ${highColor};
  }

  .yes,
  .yesbut,
  .variable {
    background-color: #ddd;
  }
`;

export const IucnMatrix = () => {
  return (
    <MatrixStyled>
      <table>
        <tr>
          <th></th>
          <th className="full" colSpan={4}>
            Full
          </th>
          <th className="high" colSpan={3}>
            High
          </th>
        </tr>
        <tr>
          <th>Activity</th>
          {Object.keys(iucnCategoriesList)
            .sort()
            .map((cat) => (
              <th className={iucnCategoriesList[cat].level}>
                {iucnCategoriesList[cat].category}
              </th>
            ))}
        </tr>
        {Object.values(iucnActivities).map((act) => {
          return (
            <tr>
              <td>{act.display}</td>
              {iucnActivityCategories[act.id].map((rank) => {
                console.log("rank", rank);
                return <td className={rank}>{activityRanks[rank].display}</td>;
              })}
            </tr>
          );
        })}
      </table>
    </MatrixStyled>
  );
};
