/**
 * Return break group that has at least min number of restricted activities
 * non-overlapping are always 'no' group
 */
export const getBreakGroup = (
  breakMap: Record<string, number>,
  numFishingRestricted?: number,
  overlap?: boolean
): string => {
  if (!numFishingRestricted)
    throw new Error("numFishingRestricted is undefined");
  if (overlap === undefined) throw new Error("overlap is undefined");
  if (overlap === false) return "no";
  const breakGroup = Object.keys(breakMap).find(
    (breakGroup) => numFishingRestricted >= breakMap[breakGroup]
  );
  if (!breakGroup)
    throw new Error(
      "getBreakGroup - could not find breakGroup, somethign is wrong"
    );
  return breakGroup;
};
