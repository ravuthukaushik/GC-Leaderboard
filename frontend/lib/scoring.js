import { PLACEMENT_POINTS, SEGREGATION_POINTS } from "@/lib/constants";
import { round } from "@/lib/utils";

function assignPlacementPoints(entries, accessor, placementPoints, direction = "asc") {
  const sorted = [...entries].sort((left, right) => {
    const leftValue = accessor(left);
    const rightValue = accessor(right);

    if (direction === "desc") {
      return rightValue - leftValue;
    }

    return leftValue - rightValue;
  });

  const pointsMap = new Map();

  sorted.forEach((entry, index) => {
    pointsMap.set(entry.hostelId, placementPoints[index] ?? 0);
  });

  return pointsMap;
}

function assignSegregationPoints(entries) {
  const statusPriority = {
    segregated: 0,
    partial: 1,
    not_segregated: 2
  };

  const sorted = [...entries].sort(
    (left, right) => statusPriority[left.segregationStatus] - statusPriority[right.segregationStatus],
  );

  const pointsMap = new Map();

  sorted.forEach((entry, index) => {
    const placementScore = PLACEMENT_POINTS.segregation[index] ?? 0;
    const fallbackStatusScore = SEGREGATION_POINTS[entry.segregationStatus] || 0;
    pointsMap.set(entry.hostelId, Math.min(placementScore, fallbackStatusScore));
  });

  return pointsMap;
}

function eventPoints(count) {
  // Treat 2 or more events as full score to avoid leaving "exactly 2" undefined.
  if (count >= 2) return 20;
  if (count >= 1) return 10;
  return 0;
}

export function calculateWeeklyScores({ hostels, submissions, previousScoresByHostel = {} }) {
  const normalized = submissions.map((entry) => ({
    ...entry,
    hostelId: entry.hostelId,
    studentsInHostel: Math.max(entry.studentsInHostel || entry.hostelPopulation || 1, 1)
  }));

  const electricityRanks = assignPlacementPoints(
    normalized,
    (entry) => entry.electricityKwh,
    PLACEMENT_POINTS.electricity,
    "asc",
  );

  const wastedFoodRanks = assignPlacementPoints(
    normalized,
    (entry) => entry.wastedFoodKg,
    PLACEMENT_POINTS.wastedFood,
    "asc",
  );

  const hostelWasteRanks = assignPlacementPoints(
    normalized,
    (entry) => entry.hostelWasteKg,
    PLACEMENT_POINTS.hostelWaste,
    "asc",
  );

  const segregationRanks = assignSegregationPoints(normalized);

  const orientationRanks = assignPlacementPoints(
    normalized,
    (entry) => entry.orientationAttendance,
    PLACEMENT_POINTS.orientation,
    "desc",
  );

  const scores = normalized.map((entry) => {
    const electricityScore = electricityRanks.get(entry.hostelId) || 0;
    const wastedFoodScore = wastedFoodRanks.get(entry.hostelId) || 0;
    const segregationScore = segregationRanks.get(entry.hostelId) || 0;
    const hostelWasteScore = hostelWasteRanks.get(entry.hostelId) || 0;
    const eventsScore = eventPoints(entry.eventsCount);
    const orientationScore = orientationRanks.get(entry.hostelId) || 0;
    const wasteScore = round(wastedFoodScore + segregationScore + hostelWasteScore);
    const energyScore = round(eventsScore + orientationScore);
    const totalScore = round(electricityScore + wasteScore + energyScore);
    const previousTotal = previousScoresByHostel[entry.hostelId]?.totalScore || 0;
    const momentumDelta = round(totalScore - previousTotal);

    return {
      weekId: entry.weekId,
      hostelId: entry.hostelId,
      totalScore,
      electricityScore,
      wasteScore,
      energyScore,
      wastedFoodScore,
      segregationScore,
      hostelWasteScore,
      eventsScore,
      orientationScore,
      electricityPerStudent: round(entry.electricityKwh / entry.studentsInHostel, 3),
      wastedFoodPerDiner: round(entry.wastedFoodKg, 3),
      momentumDelta,
      updatedAt: new Date().toISOString()
    };
  });

  const topElectricity = [...scores].sort((a, b) => b.electricityScore - a.electricityScore)[0]?.hostelId;
  const topWaste = [...scores].sort((a, b) => b.wasteScore - a.wasteScore)[0]?.hostelId;
  const topEnergy = [...scores].sort((a, b) => b.energyScore - a.energyScore)[0]?.hostelId;

  return scores
    .sort((left, right) => right.totalScore - left.totalScore)
    .map((score, index) => {
      const hostel = hostels.find((item) => item.id === score.hostelId);
      const badges = [];

      if (score.hostelId === topElectricity) badges.push("Electricity Saver");
      if (score.hostelId === topWaste) badges.push("Waste Warrior");
      if (score.hostelId === topEnergy) badges.push("Engagement Champion");
      if (index === 0) badges.push("Overall Leader");

      return {
        ...score,
        rank: index + 1,
        hostelName: hostel?.name || "Unknown Hostel",
        badges
      };
    });
}
