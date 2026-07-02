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
  { id: "wk1", label: "Week 1 · Jan 06", startsOn: "2026-01-06" },
  { id: "wk2", label: "Week 2 · Jan 13", startsOn: "2026-01-13" },
  { id: "wk3", label: "Week 3 · Jan 20", startsOn: "2026-01-20" },
  { id: "wk4", label: "Week 4 · Jan 27", startsOn: "2026-01-27" },
  { id: "wk5", label: "Week 5 · Feb 03", startsOn: "2026-02-03" }
];

const performanceProfiles = {
  h1: { e: 31.5, f: 0.12, hw: 95, ev: [0, 1, 1, 1, 1], oa: [40, 50, 48, 52, 55], s: "partial" },
  h2: { e: 25, f: 0.082, hw: 62, ev: [1, 1, 2, 2, 2], oa: [58, 62, 66, 70, 72], s: "segregated" },
  h3: { e: 28.6, f: 0.1, hw: 76, ev: [0, 1, 1, 2, 1], oa: [46, 48, 54, 56, 58], s: "partial" },
  h4: { e: 29.4, f: 0.112, hw: 82, ev: [0, 0, 1, 1, 1], oa: [42, 44, 46, 48, 49], s: "partial" },
  h5: { e: 22.8, f: 0.068, hw: 54, ev: [2, 2, 2, 2, 3], oa: [72, 78, 80, 84, 86], s: "segregated" },
  h6: { e: 32.1, f: 0.12, hw: 98, ev: [0, 0, 0, 1, 1], oa: [34, 37, 40, 44, 46], s: "not_segregated" },
  h7: { e: 27.2, f: 0.093, hw: 70, ev: [1, 1, 1, 1, 2], oa: [50, 52, 54, 59, 63], s: "segregated" },
  h8: { e: 30.4, f: 0.105, hw: 74, ev: [0, 1, 1, 1, 1], oa: [48, 50, 51, 55, 56], s: "partial" },
  h9: { e: 24.6, f: 0.078, hw: 60, ev: [1, 1, 2, 2, 2], oa: [60, 64, 66, 70, 74], s: "segregated" },
  h10: { e: 26.8, f: 0.089, hw: 72, ev: [1, 1, 1, 2, 2], oa: [54, 56, 58, 60, 66], s: "segregated" },
  h11: { e: 33.3, f: 0.125, hw: 102, ev: [0, 0, 1, 0, 0], oa: [30, 33, 35, 34, 36], s: "not_segregated" },
  h12: { e: 26.1, f: 0.086, hw: 66, ev: [1, 1, 1, 2, 2], oa: [56, 60, 62, 66, 68], s: "segregated" },
  h13: { e: 34.1, f: 0.132, hw: 108, ev: [0, 0, 0, 0, 1], oa: [28, 30, 31, 33, 35], s: "not_segregated" },
  h14: { e: 25.8, f: 0.084, hw: 68, ev: [1, 1, 1, 2, 2], oa: [52, 55, 58, 63, 70], s: "segregated" }
};

const submissions = weeks.flatMap((week, weekIndex) =>
  hostels.map((hostel, hostelIndex) => {
    const profile = performanceProfiles[hostel.id];
    const oscillation = ((hostelIndex + weekIndex) % 3) - 1;
    const diners = Math.round(hostel.population * 0.82);

    return {
      weekId: week.id,
      hostelId: hostel.id,
      hostelPopulation: hostel.population,
      studentsInHostel: hostel.population,
      electricityKwh: Number(((profile.e + weekIndex * 0.3 + oscillation * 0.2) * hostel.population).toFixed(1)),
      wastedFoodKg: Number(((profile.f + weekIndex * -0.002 + oscillation * 0.001) * diners).toFixed(1)),
      hostelWasteKg: Number((profile.hw + weekIndex * -2 + oscillation * 1.5).toFixed(1)),
      messDiners: diners,
      segregationStatus: profile.s,
      eventsCount: profile.ev[weekIndex],
      orientationAttendance: profile.oa[weekIndex],
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
