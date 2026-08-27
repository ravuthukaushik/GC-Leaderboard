import { BASKET_WEIGHTS, BASKET_MAX, eventPerformancePoints } from "@/lib/constants";
import { round } from "@/lib/utils";

function num(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function bool(value) {
  return value === true || value === 1 || value === "true" ? 1 : 0;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// Relative score for a "lower is better" per-capita metric.
// The hostel with the smallest per-capita value scores 100; others scale down.
function relativeLowestWins(perCapitaValues, ownValue) {
  const positives = perCapitaValues.filter((value) => value > 0);
  if (!positives.length || ownValue <= 0) return 0;
  const minValue = Math.min(...positives);
  return clamp((minValue / ownValue) * 100, 0, 100);
}

export function calculateWeeklyScores({ hostels, submissions, previousScoresByHostel = {} }) {
  const normalized = submissions.map((entry) => {
    const students = Math.max(num(entry.studentsInHostel || entry.hostelPopulation, 1), 1);
    const messEaters = Math.max(num(entry.messEatingStudents, students), 1);

    return {
      ...entry,
      studentsInHostel: students,
      messEatingStudents: messEaters,
      electricityPerStudent: num(entry.electricityKwh) / students,
      messWastePerStudent: num(entry.messWasteKg) / messEaters
    };
  });

  const electricityPerCapita = normalized.map((entry) => entry.electricityPerStudent);
  const messPerCapita = normalized.map((entry) => entry.messWastePerStudent);

  const scores = normalized.map((entry) => {
    const students = entry.studentsInHostel;

    // ── Electricity (10) ──
    const electricityConsumptionScore = round(
      (relativeLowestWins(electricityPerCapita, entry.electricityPerStudent) / 100) *
        BASKET_WEIGHTS.electricity.consumption,
    );
    const electricityScore = electricityConsumptionScore;

    // ── Water (5) ──
    const tanks = num(entry.waterTanks);
    let sensorPercent;
    if (bool(entry.overflowSensorInstalled)) {
      sensorPercent = tanks > 0 ? (num(entry.workingOverflowSensors) / tanks) * 100 : 0;
    } else {
      // Penalty when no overflow sensor is installed: -1 per tank.
      sensorPercent = -1 * tanks;
    }
    const waterScore = round((clamp(sensorPercent, -100, 100) / 100) * BASKET_WEIGHTS.water.sensor);

    // ── Waste (30) ──
    const messWasteScore = round(
      (relativeLowestWins(messPerCapita, entry.messWastePerStudent) / 100) * BASKET_WEIGHTS.waste.mess,
    );
    const foodWasteAppScore = bool(entry.foodWasteApp) ? BASKET_WEIGHTS.waste.foodWasteApp : 0;
    const fourBinScore = bool(entry.fourBinSegregation) ? BASKET_WEIGHTS.waste.fourBin : 0;
    const dustbinsTotal = num(entry.dustbinsTotal);
    const segregationScore = round(
      dustbinsTotal > 0
        ? clamp(num(entry.dustbinsWithSignage) / dustbinsTotal, 0, 1) * BASKET_WEIGHTS.waste.segregation
        : 0,
    );
    const wasteInitiativeScore = bool(entry.wasteReductionInitiative)
      ? BASKET_WEIGHTS.waste.initiative
      : 0;
    const wasteScore = round(
      messWasteScore + foodWasteAppScore + fourBinScore + segregationScore + wasteInitiativeScore,
    );

    // ── Representation (20) ──
    const secretaryScore = bool(entry.sustainabilitySecretary)
      ? BASKET_WEIGHTS.representation.secretary
      : 0;
    const meetingsTotal = num(entry.meetingsTotal);
    const meetsScore = round(
      meetingsTotal > 0
        ? clamp(num(entry.meetingsAttended) / meetingsTotal, 0, 1) * BASKET_WEIGHTS.representation.meets
        : 0,
    );
    const pilotScore = bool(entry.pilotInvolvement) ? BASKET_WEIGHTS.representation.pilot : 0;
    const representationScore = round(secretaryScore + meetsScore + pilotScore);

    // ── Events (30) ──
    const performancePoints = eventPerformancePoints(entry.eventPlacement);
    const participationPercent =
      students > 0 ? clamp((num(entry.participatingStudents) / students) * 100, 0, 100) : 0;
    // Individual participation: (performance + participation)/100 × 25, capped.
    const eventsParticipationScore = round(
      clamp(
        ((performancePoints + participationPercent) / 100) * BASKET_WEIGHTS.events.participation,
        0,
        BASKET_WEIGHTS.events.participation,
      ),
    );
    // Green Score Calculator: residents who used it / total residents × 5.
    const greenScorePercent =
      students > 0 ? clamp((num(entry.greenScoreUsers) / students) * 100, 0, 100) : 0;
    const greenScoreScore = round((greenScorePercent / 100) * BASKET_WEIGHTS.events.greenScore);
    const eventsScore = round(eventsParticipationScore + greenScoreScore);

    // ── Attendance (5) ──
    const attendanceRatio = students > 0 ? clamp(num(entry.ocRepresentatives) / students, 0, 1) : 0;
    const attendanceScore = round(attendanceRatio * BASKET_WEIGHTS.attendance);

    // ── Extras (bonus) ──
    const sopScore = round(num(entry.sopInitiatives) * BASKET_WEIGHTS.extras.sopPerInitiative);
    const uniqueScore = round(Math.max(num(entry.uniqueInitiativePoints), 0));
    const extrasScore = round(sopScore + uniqueScore);

    const totalScore = round(
      electricityScore +
        waterScore +
        wasteScore +
        representationScore +
        eventsScore +
        attendanceScore +
        extrasScore,
    );

    const previousTotal = previousScoresByHostel[entry.hostelId]?.totalScore || 0;
    const momentumDelta = round(totalScore - previousTotal);

    return {
      weekId: entry.weekId,
      hostelId: entry.hostelId,
      totalScore,
      // basket totals
      electricityScore,
      waterScore,
      wasteScore,
      representationScore,
      eventsScore,
      attendanceScore,
      extrasScore,
      // sub-scores (kept for transparency / analytics)
      electricityConsumptionScore,
      waterSensorScore: waterScore,
      messWasteScore,
      foodWasteAppScore,
      fourBinScore,
      segregationScore,
      wasteInitiativeScore,
      secretaryScore,
      meetsScore,
      pilotScore,
      eventsParticipationScore,
      greenScoreScore,
      sopScore,
      uniqueScore,
      // derived per-capita figures
      electricityPerStudent: round(entry.electricityPerStudent, 3),
      messWastePerStudent: round(entry.messWastePerStudent, 3),
      momentumDelta,
      updatedAt: new Date().toISOString()
    };
  });

  const topBy = (accessor) => [...scores].sort((a, b) => accessor(b) - accessor(a))[0]?.hostelId;
  const topElectricity = topBy((s) => s.electricityScore);
  const topWater = topBy((s) => s.waterScore);
  const topWaste = topBy((s) => s.wasteScore);
  const topRepresentation = topBy((s) => s.representationScore);
  const topEvents = topBy((s) => s.eventsScore);

  return scores
    .sort((left, right) => right.totalScore - left.totalScore)
    .map((score, index) => {
      const hostel = hostels.find((item) => item.id === score.hostelId);
      const badges = [];

      if (score.hostelId === topElectricity) badges.push("Electricity Saver");
      if (score.hostelId === topWater) badges.push("Water Guardian");
      if (score.hostelId === topWaste) badges.push("Waste Warrior");
      if (score.hostelId === topRepresentation) badges.push("Representation Star");
      if (score.hostelId === topEvents) badges.push("Events Champion");
      if (index === 0) badges.push("Overall Leader");

      return {
        ...score,
        rank: index + 1,
        hostelName: hostel?.name || "Unknown Hostel",
        badges
      };
    });
}

export { BASKET_MAX };
