/**
 * Return break group that has at least min number of restricted activities
 * non-overlapping are always 'no' group
 */
export const getBreakGroup = (
  breakMap: Record<string, number>,
  numFishingRestricted?: number,
  overlap?: boolean
): string => {
  if (numFishingRestricted === undefined || numFishingRestricted === null)
    throw new Error("Missing numFishingRestricted");
  if (overlap === undefined) throw new Error("Missing overlap");
  if (overlap === false) return "no";
  const breakGroup = Object.keys(breakMap).find(
    (breakGroup) => numFishingRestricted >= breakMap[breakGroup]
  );
  if (!breakGroup)
    throw new Error(
      "getBreakGroup - could not find breakGroup, something is wrong"
    );
  return breakGroup;
};
