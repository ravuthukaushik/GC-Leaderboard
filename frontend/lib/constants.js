// Green Cup scoring rubric — basket weightages.
// Core baskets sum to 95; Ganesha Workshop (5) rounds the season out to 100,
// while SOP-listed and new/unique initiatives are pure bonus points on top.
export const BASKET_WEIGHTS = {
  electricity: {
    consumption: 10, // relative, lowest per-capita consumption wins
    initiative: 5 // binary: at least one hostel-wide initiative
  },
  water: {
    meter: 10, // binary: water meter installed
    sensor: 5 // ratio of working overflow sensors to tanks (penalty if none)
  },
  waste: {
    mess: 10, // relative, lowest per-capita mess waste wins
    segregation: 5, // ratio of dustbins with proper signage
    initiative: 5 // binary: at least one waste-reduction initiative
  },
  representation: {
    secretary: 5, // binary: sustainability secretary appointed
    meets: 10, // attendance ratio in sustainability-cell meets
    pilot: 5 // binary: at least one pilot/suggestion held per sem
  },
  events: 20, // performance placement + participation percentage
  attendance: 5, // Green Cup OC attendance ratio
  extras: {
    sopPerInitiative: 3, // points per approved SOP-listed initiative
    uniqueMaxPerInitiative: 5, // subjective, up to 5 per new/unique initiative
    ganesha: 5 // Ganesha workshop participation percentage
  }
};

// Maximum score a single basket can contribute (used for segment-bar scaling).
export const BASKET_MAX = {
  electricity: BASKET_WEIGHTS.electricity.consumption + BASKET_WEIGHTS.electricity.initiative, // 15
  water: BASKET_WEIGHTS.water.meter + BASKET_WEIGHTS.water.sensor, // 15
  waste:
    BASKET_WEIGHTS.waste.mess + BASKET_WEIGHTS.waste.segregation + BASKET_WEIGHTS.waste.initiative, // 20
  representation:
    BASKET_WEIGHTS.representation.secretary +
    BASKET_WEIGHTS.representation.meets +
    BASKET_WEIGHTS.representation.pilot, // 20
  events: BASKET_WEIGHTS.events, // 20
  attendance: BASKET_WEIGHTS.attendance // 5
};

// Grouped columns shown on the leaderboard table (keeps the 3-column layout).
// Each group maps to one of the existing accent colours.
export const DISPLAY_GROUPS = {
  resources: ["electricity", "water"], // blue
  waste: ["waste"], // green
  community: ["representation", "events", "attendance", "extras"] // purple
};

// Performance points for the Events basket: winner 100, then -10 per placement.
export function eventPerformancePoints(placement) {
  const rank = Number(placement) || 0;
  if (rank < 1) return 0;
  return Math.max(0, 100 - (rank - 1) * 10);
}
