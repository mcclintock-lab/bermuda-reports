export interface IucnCategory {
  category: string | null;
  name: string;
  allowedActivities: string[];
  level: string;
}

export interface IucnActivity {
  id: string;
  name: string;
}

export const iucnActivities = [
  "RESEARCH_NE",
  "TRAD_USE_NE",
  "RESTORE_CON",
  "TRAD_FISH_COLLECT",
  "RECREATE_NE",
  "TOURISM",
  "SHIPPING",
  "RESEARCH",
  "RENEWABLE_ENERGY",
  "RESTORE_OTH",
  "FISH_COLLECT_REC",
  "FISH_COLLECT_LOCAL",
  "FISH_AQUA_INDUSTRIAL",
  "AQUA_SMALL",
  "WORKS",
  "UNTREATED_WATER",
  "MINING_OIL_GAS",
  "HABITATION",
];

/** IUCN category definitions.  Note categories 2/3 and 4/6 have been merged because they have the same allowed uses */
export const iucnCategories: Record<string, IucnCategory> = {
  "1a": {
    category: "1a",
    level: "full",
    name: "Strict Nature Reserve",
    allowedActivities: ["RESEARCH_NE", "TRAD_USE_NE", "RESTORE_CON"],
  },
  "1b": {
    category: "1b",
    level: "full",
    name: "Wilderness Area",
    allowedActivities: [
      "RESEARCH_NE",
      "TRAD_USE_NE",
      "RESTORE_CON",
      "TRAD_FISH_COLLECT",
      "RECREATE_NE",
    ],
  },
  // "2": {
  //   category: "2",
  //   name: "National Park",
  //   allowedActivities: [
  //     "RESEARCH_NE",
  //     "TRAD_USE_NE",
  //     "RESTORE_CON",
  //     "TRAD_FISH_COLLECT",
  //     "RECREATE_NE",
  //     "TOURISM",
  //   ],
  // },
  // "3": {
  //   category: "3",
  //   name: "Natural Monument or Feature",
  //   allowedActivities: [
  //     "RESEARCH_NE",
  //     "TRAD_USE_NE",
  //     "RESTORE_CON",
  //     "TRAD_FISH_COLLECT",
  //     "RECREATE_NE",
  //     "TOURISM",
  //   ],
  // },
  "2/3": {
    category: "2/3",
    level: "full",
    name: "National Park or Natural Monument/Feature",
    allowedActivities: [
      "RESEARCH_NE",
      "TRAD_USE_NE",
      "RESTORE_CON",
      "TRAD_FISH_COLLECT",
      "RECREATE_NE",
      "TOURISM",
    ],
  },
  "4/6": {
    category: "4/6",
    level: "high",
    name:
      "Habitat/Species Management Area or Protected area with sustainable use of natural resources",
    allowedActivities: [
      "RESEARCH_NE",
      "TRAD_USE_NE",
      "RESTORE_CON",
      "TRAD_FISH_COLLECT",
      "RECREATE_NE",
      "TOURISM",
      "SHIPPING",
      "RESEARCH",
      "RENEWABLE_ENERGY",
      "RESTORE_OTH",
      "FISH_COLLECT_REC",
      "FISH_COLLECT_LOCAL",
      "AQUA_SMALL",
      "WORKS",
    ],
  },
  // "4": {
  //   category: "4",
  //   name: "Habitat/Species Management Area",
  //   allowedActivities: [
  //     "RESEARCH_NE",
  //     "TRAD_USE_NE",
  //     "RESTORE_CON",
  //     "TRAD_FISH_COLLECT",
  //     "RECREATE_NE",
  //     "TOURISM",
  //     "SHIPPING",
  //     "RESEARCH",
  //     "RENEWABLE_ENERGY",
  //     "RESTORE_OTH",
  //     "FISH_COLLECT_REC",
  //     "FISH_COLLECT_LOCAL",
  //     "AQUA_SMALL",
  //     "WORKS",
  //   ],
  // },
  "5": {
    category: "5",
    level: "high",
    name: "Protected Landscape/Seascape",
    allowedActivities: [
      "RESEARCH_NE",
      "TRAD_USE_NE",
      "RESTORE_CON",
      "TRAD_FISH_COLLECT",
      "RECREATE_NE",
      "TOURISM",
      "SHIPPING",
      "RESEARCH",
      "RENEWABLE_ENERGY",
      "RESTORE_OTH",
      "FISH_COLLECT_REC",
      "FISH_COLLECT_LOCAL",
      "AQUA_SMALL",
      "WORKS",
      "HABITATION",
    ],
  },
  // "6": {
  //   category: "6",
  //   name: "Protected area with sustainable use of natural resources",
  //   allowedActivities: [
  //     "RESEARCH_NE",
  //     "TRAD_USE_NE",
  //     "RESTORE_CON",
  //     "TRAD_FISH_COLLECT",
  //     "RECREATE_NE",
  //     "TOURISM",
  //     "SHIPPING",
  //     "RESEARCH",
  //     "RENEWABLE_ENERGY",
  //     "RESTORE_OTH",
  //     "FISH_COLLECT_REC",
  //     "FISH_COLLECT_LOCAL",
  //     "AQUA_SMALL",
  //     "WORKS",
  //   ],
  // },
};

/**
 * Given list of allowed activities in the sketch, returns the highest category allowable
 * The lack of an activity assumes it is not allowed
 * @param sketch
 * @param activityAttrib
 */
export const getCategoryForActivities = (activities: string[]) => {
  if (activities.length === 0) return null;

  // Get first category where all activities allowed in sketch are allowed by the category
  let firstCategory: string | null = null;
  const categories = Object.keys(iucnCategories).sort();
  for (const category of categories) {
    const hasCategory = activities
      .map((act) => iucnCategories[category].allowedActivities.includes(act))
      .reduce((acc, hasActivity) => acc && hasActivity, true);
    if (hasCategory) {
      firstCategory = category;
      break;
    }
  }
  return firstCategory;
};

/**
 * Returns IUCN category object given category ID.  If category not found it returns a special low protection object
 */
export const getCategoryWithId = (categoryId: string | null) => {
  return categoryId
    ? iucnCategories[categoryId]
    : { category: null, level: "low", name: "None", allowedActivities: [] };
};
