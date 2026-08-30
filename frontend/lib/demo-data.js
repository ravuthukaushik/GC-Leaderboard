import { calculateWeeklyScores } from "@/lib/scoring";

const hostels = [
  ["h1", "Hostel 1", 410],
  ["h2", "Hostel 2", 395],
  ["h3", "Hostel 3", 380],
  ["h4", "Hostel 4", 360],
  ["h5", "Hostel 5", 420],
  ["h6", "Hostel 6", 350],
  ["h7", "Hostel 7", 370],
  ["h8", "Hostel 8", 365],
  ["h9", "Hostel 9", 400],
  ["h10", "Hostel 10", 390],
  ["h11", "Hostel 11", 345],
  ["h12", "Hostel 12", 405],
  ["h13", "Hostel 13", 330],
  ["h14", "Hostel 14", 415]
].map(([id, name, population]) => ({ id, name, population }));

const weeks = [
  { id: "wk1", label: "Aug", startsOn: "2026-08-04" },
  { id: "wk2", label: "Sept", startsOn: "2026-09-01" },
  { id: "wk3", label: "Oct", startsOn: "2026-10-06" },
  { id: "wk4", label: "Nov", startsOn: "2026-11-03" }
];

// Per-hostel performance profile driving the demo submissions.
// e = kWh per student, mw = mess waste kg per diner, quality 0..1 tunes the
// binary/ratio metrics so the leaderboard shows a realistic spread.
const performanceProfiles = {
  h1: { e: 31.5, mw: 0.12, quality: 0.55, tanks: 5, place: [0, 3, 2, 2, 1] },
  h2: { e: 25.0, mw: 0.082, quality: 0.88, tanks: 4, place: [2, 1, 1, 1, 1] },
  h3: { e: 28.6, mw: 0.1, quality: 0.7, tanks: 5, place: [0, 2, 3, 2, 2] },
  h4: { e: 29.4, mw: 0.112, quality: 0.62, tanks: 6, place: [0, 0, 4, 3, 3] },
  h5: { e: 22.8, mw: 0.068, quality: 0.95, tanks: 4, place: [1, 1, 1, 1, 1] },
  h6: { e: 32.1, mw: 0.12, quality: 0.4, tanks: 6, place: [0, 0, 0, 5, 4] },
  h7: { e: 27.2, mw: 0.093, quality: 0.78, tanks: 5, place: [3, 2, 2, 2, 2] },
  h8: { e: 30.4, mw: 0.105, quality: 0.6, tanks: 5, place: [0, 3, 3, 4, 3] },
  h9: { e: 24.6, mw: 0.078, quality: 0.9, tanks: 4, place: [1, 1, 1, 1, 1] },
  h10: { e: 26.8, mw: 0.089, quality: 0.82, tanks: 5, place: [2, 2, 2, 1, 2] },
  h11: { e: 33.3, mw: 0.125, quality: 0.35, tanks: 7, place: [0, 0, 4, 0, 5] },
  h12: { e: 26.1, mw: 0.086, quality: 0.84, tanks: 4, place: [2, 1, 2, 2, 1] },
  h13: { e: 34.1, mw: 0.132, quality: 0.3, tanks: 7, place: [0, 0, 0, 0, 4] },
  h14: { e: 25.8, mw: 0.084, quality: 0.86, tanks: 5, place: [2, 2, 1, 2, 1] }
};

const submissions = weeks.flatMap((week, weekIndex) =>
  hostels.map((hostel, hostelIndex) => {
    const profile = performanceProfiles[hostel.id];
    const q = profile.quality;
    const oscillation = ((hostelIndex + weekIndex) % 3) - 1;
    const diners = Math.round(hostel.population * 0.82);
    const dustbins = 6;
    const meetingsTotal = 4;

    return {
      weekId: week.id,
      hostelId: hostel.id,
      hostelPopulation: hostel.population,
      studentsInHostel: hostel.population,

      // Electricity
      electricityKwh: Number(((profile.e + weekIndex * 0.3 + oscillation * 0.2) * hostel.population).toFixed(1)),

      // Water
      overflowSensorInstalled: q > 0.5,
      waterTanks: profile.tanks,
      workingOverflowSensors: Math.min(profile.tanks, Math.round(profile.tanks * q)),

      // Waste
      messWasteKg: Number(((profile.mw + weekIndex * -0.002 + oscillation * 0.001) * diners).toFixed(1)),
      messEatingStudents: diners,
      foodWasteApp: q > 0.6,
      fourBinSegregation: q > 0.65,
      dustbinsTotal: dustbins,
      dustbinsWithSignage: Math.round(dustbins * q),
      wasteReductionInitiative: q > 0.55,

      // Representation
      sustainabilitySecretary: q > 0.4,
      meetingsTotal,
      meetingsAttended: Math.min(meetingsTotal, Math.round(meetingsTotal * q) + (weekIndex % 2)),
      pilotInvolvement: q > 0.7,

      // Events
      eventPlacement: profile.place[weekIndex],
      participatingStudents: Math.round(hostel.population * (0.04 + q * 0.12)),
      greenScoreUsers: Math.round(hostel.population * (0.05 + q * 0.35)),

      // Attendance
      ocRepresentatives: Math.round(6 + q * 10),

      // Extras
      sopInitiatives: q > 0.8 ? 2 : q > 0.55 ? 1 : 0,
      uniqueInitiativePoints: q > 0.85 ? 5 : q > 0.6 ? 3 : 0,

      notes: "Demo data"
    };
  }),
);

export function getDemoDataset() {
  const scoresByWeek = {};
  let previousScoresByHostel = {};

  for (const week of weeks) {
    const currentSubmissions = submissions.filter((entry) => entry.weekId === week.id);
    const weekScores = calculateWeeklyScores({
      hostels,
      submissions: currentSubmissions,
      previousScoresByHostel
    });

    scoresByWeek[week.id] = weekScores;
    previousScoresByHostel = Object.fromEntries(
      weekScores.map((score) => [score.hostelId, score]),
    );
  }

  return {
    hostels,
    weeks,
    submissions,
    scoresByWeek
  };
}
