export const SCORE_LIMITS = {
  electricity: 30,
  wastedFood: 20,
  segregation: 15,
  hostelWaste: 10,
  events: 20,
  orientation: 5
};

export const PLACEMENT_POINTS = {
  wastedFood: [20, 15, 10, 5, 0],
  segregation: [15, 7.5, 0],
  hostelWaste: [10, 8, 5],
  electricity: [30, 25, 20, 15, 10],
  orientation: [5, 3.5, 2.5]
};

export const SEGREGATION_LABELS = {
  segregated: "Well segregated",
  partial: "Partially segregated",
  not_segregated: "Not segregated"
};

export const SEGREGATION_POINTS = {
  segregated: SCORE_LIMITS.segregation,
  partial: SCORE_LIMITS.segregation / 2,
  not_segregated: 0
};
