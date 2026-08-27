import { getDemoDataset } from "@/lib/demo-data";
import { calculateWeeklyScores } from "@/lib/scoring";
import { DISPLAY_GROUPS } from "@/lib/constants";
import { round } from "@/lib/utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Single source of truth mapping each editable input to its DB column + type.
export const SUBMISSION_COLUMN_MAP = [
  { column: "electricity_kwh", field: "electricityKwh", type: "number" },
  { column: "overflow_sensor_installed", field: "overflowSensorInstalled", type: "bool" },
  { column: "water_tanks", field: "waterTanks", type: "number" },
  { column: "working_overflow_sensors", field: "workingOverflowSensors", type: "number" },
  { column: "mess_waste_kg", field: "messWasteKg", type: "number" },
  { column: "mess_eating_students", field: "messEatingStudents", type: "number" },
  { column: "food_waste_app", field: "foodWasteApp", type: "bool" },
  { column: "four_bin_segregation", field: "fourBinSegregation", type: "bool" },
  { column: "dustbins_total", field: "dustbinsTotal", type: "number" },
  { column: "dustbins_with_signage", field: "dustbinsWithSignage", type: "number" },
  { column: "waste_reduction_initiative", field: "wasteReductionInitiative", type: "bool" },
  { column: "sustainability_secretary", field: "sustainabilitySecretary", type: "bool" },
  { column: "meetings_attended", field: "meetingsAttended", type: "number" },
  { column: "meetings_total", field: "meetingsTotal", type: "number" },
  { column: "pilot_involvement", field: "pilotInvolvement", type: "bool" },
  { column: "event_placement", field: "eventPlacement", type: "number" },
  { column: "participating_students", field: "participatingStudents", type: "number" },
  { column: "green_score_users", field: "greenScoreUsers", type: "number" },
  { column: "oc_representatives", field: "ocRepresentatives", type: "number" },
  { column: "sop_initiatives", field: "sopInitiatives", type: "number" },
  { column: "unique_initiative_points", field: "uniqueInitiativePoints", type: "number" }
];

// Every weekly input field the admin can edit, in submission (camelCase) form.
export const SUBMISSION_FIELDS = SUBMISSION_COLUMN_MAP.map((item) => item.field);

const BASKET_KEYS = [
  "electricityScore",
  "waterScore",
  "wasteScore",
  "representationScore",
  "eventsScore",
  "attendanceScore",
  "extrasScore"
];

// Sum a set of basket scores into one of the three leaderboard display groups.
function groupScore(source, group) {
  return DISPLAY_GROUPS[group].reduce((sum, basket) => sum + Number(source[`${basket}Score`] || 0), 0);
}

function useDemoMode() {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

function monthLabel(input) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric"
  }).format(new Date(input));
}

function numericHostelSort(left, right) {
  const leftNumber = Number.parseInt(String(left.name).replace(/\D+/g, ""), 10);
  const rightNumber = Number.parseInt(String(right.name).replace(/\D+/g, ""), 10);

  if (Number.isNaN(leftNumber) || Number.isNaN(rightNumber)) {
    return String(left.name).localeCompare(String(right.name), "en", { numeric: true });
  }

  return leftNumber - rightNumber;
}

function roleMeta(role) {
  const config = {
    admin: {
      label: "Admin",
      editableFields: SUBMISSION_FIELDS
    },
    viewer: {
      label: "Viewer",
      editableFields: []
    }
  };

  return config[role] || config.viewer;
}

function buildPayload({ hostels, weeks, scoresByWeek, activeWeekId, usingDemoData }) {
  const activeWeek = weeks.find((week) => week.id === activeWeekId) || weeks.at(-1);
  const visibleHostels = [...hostels].sort(numericHostelSort);
  const visibleHostelIds = new Set(visibleHostels.map((hostel) => hostel.id));
  const allScores = weeks.flatMap((week) =>
    (scoresByWeek[week.id] || []).filter((score) => visibleHostelIds.has(score.hostelId)),
  );
  const latestScores = (scoresByWeek[activeWeek.id] || []).filter((score) =>
    visibleHostelIds.has(score.hostelId),
  );
  const emptyAccumulator = (hostelId, name) => ({
    hostelId,
    name,
    totalScore: 0,
    weeksCount: 0,
    momentumDelta: 0,
    badges: [],
    ...Object.fromEntries(BASKET_KEYS.map((key) => [key, 0]))
  });

  const lifetimeMap = new Map(
    visibleHostels.map((hostel) => [hostel.id, emptyAccumulator(hostel.id, hostel.name)]),
  );

  allScores.forEach((score) => {
    const current = lifetimeMap.get(score.hostelId) || emptyAccumulator(score.hostelId, score.hostelName);

    current.totalScore += Number(score.totalScore || 0);
    BASKET_KEYS.forEach((key) => {
      current[key] += Number(score[key] || 0);
    });
    current.weeksCount += 1;
    lifetimeMap.set(score.hostelId, current);
  });

  latestScores.forEach((score) => {
    const current = lifetimeMap.get(score.hostelId);
    if (!current) return;
    current.momentumDelta = Number(score.momentumDelta || 0);
    current.badges = score.badges || [];
  });

  const leaderboard = Array.from(lifetimeMap.values())
    .map((score) => {
      const averaged = { ...score, totalScore: round(score.weeksCount ? score.totalScore / score.weeksCount : 0) };
      BASKET_KEYS.forEach((key) => {
        averaged[key] = round(score.weeksCount ? score[key] / score.weeksCount : 0);
      });
      // Grouped columns for the leaderboard table (Resources / Waste / Community).
      averaged.resourcesScore = round(groupScore(averaged, "resources"));
      averaged.communityScore = round(groupScore(averaged, "community"));
      return averaged;
    })
    .sort((left, right) => right.totalScore - left.totalScore)
    .map((score, index) => ({
      ...score,
      rank: index + 1
    }));

  const leader = leaderboard[0] || null;
  const averageScore = leaderboard.length
    ? round(leaderboard.reduce((sum, item) => sum + item.totalScore, 0) / leaderboard.length)
    : 0;
  const biggestClimber = [...leaderboard].sort((a, b) => b.momentumDelta - a.momentumDelta)[0] || null;
  const trendHostels = leaderboard.slice(0, 5).map((item) => item.name);
  const trends = weeks.map((week) => {
    const scores = scoresByWeek[week.id] || [];
    const row = {
      label: week.label,
      averageScore: scores.length
        ? round(scores.reduce((sum, score) => sum + score.totalScore, 0) / scores.length)
        : 0
    };

    trendHostels.forEach((hostelName) => {
      const match = scores.find((score) => score.hostelName === hostelName);
      row[hostelName] = match?.totalScore ?? null;
    });

    return row;
  });

  const trendSeries = trendHostels.map((name, index) => ({
    key: name,
    color: ["#2ec27e", "#30a2ff", "#ff9f0a", "#b24adb", "#ff4f8b"][index % 5]
  }));

  const breakdown = leaderboard.map((item) => ({
    name: item.name.replace("Hostel ", "H"),
    resources: item.resourcesScore,
    waste: item.wasteScore,
    community: item.communityScore
  }));

  const bestWaste = [...leaderboard].sort((a, b) => b.wasteScore - a.wasteScore)[0] || null;
  const bestCommunity = [...leaderboard].sort((a, b) => b.communityScore - a.communityScore)[0] || null;
  const resourcesLeader = [...leaderboard].sort((a, b) => b.resourcesScore - a.resourcesScore)[0] || null;

  const categoryLeaders = {
    resources: resourcesLeader?.hostelId || null,
    waste: bestWaste?.hostelId || null,
    community: bestCommunity?.hostelId || null
  };

  leaderboard.forEach((entry) => {
    const badges = [];
    if (entry.hostelId === categoryLeaders.resources) badges.push("⚡ Resources Leader");
    if (entry.hostelId === categoryLeaders.waste) badges.push("♻️ Waste Leader");
    if (entry.hostelId === categoryLeaders.community) badges.push("🤝 Community Leader");
    entry.categoryLeaderBadges = badges;
  });

  const monthlyAverage = trends.length
    ? round(trends.reduce((sum, week) => sum + week.averageScore, 0) / trends.length)
    : averageScore;

  return {
    hostels: visibleHostels,
    weeks,
    activeWeek,
    activeMonth: monthLabel(activeWeek.startsOn),
    leaderboard,
    breakdown,
    trends,
    trendSeries,
    categoryLeaders,
    insights: [
      {
        label: "Overall leader",
        title: leader ? `${leader.name} is leading overall` : "No leaderboard yet",
        description: leader
          ? `${leader.name} tops the Green Cup with an average score of ${leader.totalScore.toFixed(1)}.`
          : "Upload the first weekly dataset to unlock standings."
      },
      {
        label: "Waste performance",
        title: bestWaste ? `${bestWaste.name} owns the waste basket` : "Waste basket pending",
        description: bestWaste
          ? `${bestWaste.name} currently has the strongest combined mess-waste, segregation, and initiative score.`
          : "Waste metrics appear once mess data is entered."
      },
      {
        label: "Community performance",
        title: bestCommunity ? `${bestCommunity.name} is driving engagement` : "Community engagement pending",
        description: bestCommunity
          ? `${bestCommunity.name} is leading through representation, events, attendance, and extra initiatives.`
          : "Upload representation, events, and attendance data to reveal this insight."
      },
      {
        label: "Resource efficiency",
        title: resourcesLeader
          ? `${resourcesLeader.name} is the resource saver`
          : "Resource ranking pending",
        description: resourcesLeader
          ? `${resourcesLeader.name} currently leads the combined electricity and water baskets.`
          : "Resource rankings will appear after the first upload."
      }
    ],
    summary: {
      hostelCount: visibleHostels.length,
      leader,
      averageScore,
      monthlyAverage,
      biggestClimber
    },
    meta: {
      generatedAt: new Date().toISOString(),
      usingDemoData
    }
  };
}

async function getSupabaseDataset() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const [hostelsResponse, weeksResponse, scoresResponse] = await Promise.all([
    supabase.from("hostels").select("*").order("name"),
    supabase.from("reporting_weeks").select("*").order("starts_on"),
    supabase.from("weekly_scores").select("*").order("updated_at", { ascending: false })
  ]);

  if (hostelsResponse.error || weeksResponse.error || scoresResponse.error) {
    throw new Error(
      hostelsResponse.error?.message ||
        weeksResponse.error?.message ||
        scoresResponse.error?.message,
    );
  }

  const hostels = hostelsResponse.data.map((item) => ({
    id: item.id,
    name: item.name,
    population: item.population
  }))
    .sort(numericHostelSort);

  const weeks = weeksResponse.data.map((item) => ({
    id: item.id,
    label: item.label,
    startsOn: item.starts_on
  }));

  const scoresByWeek = weeks.reduce((accumulator, week) => {
    accumulator[week.id] = scoresResponse.data
      .filter((score) => score.week_id === week.id)
      .sort((left, right) => left.rank - right.rank)
      .map((score) => ({
        hostelId: score.hostel_id,
        hostelName: score.hostel_name,
        rank: score.rank,
        totalScore: score.total_score,
        electricityScore: score.electricity_score,
        waterScore: score.water_score,
        wasteScore: score.waste_score,
        representationScore: score.representation_score,
        eventsScore: score.events_score,
        attendanceScore: score.attendance_score,
        extrasScore: score.extras_score,
        momentumDelta: score.momentum_delta,
        badges: score.badges || []
      }));

    return accumulator;
  }, {});

  return { hostels, weeks, scoresByWeek };
}

export async function getViewer() {
  if (useDemoMode()) {
    return {
      email: null,
      role: "viewer",
      requestedRole: "viewer",
      approved: false,
      isAdmin: false,
      permissions: roleMeta("viewer")
    };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return {
      email: null,
      role: "viewer",
      requestedRole: "viewer",
      approved: false,
      isAdmin: false,
      permissions: roleMeta("viewer")
    };
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      email: null,
      role: "viewer",
      requestedRole: "viewer",
      approved: false,
      isAdmin: false,
      permissions: roleMeta("viewer")
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, requested_role, approved")
    .eq("id", user.id)
    .single();

  const approved = Boolean(profile?.approved);
  const activeRole = approved ? profile?.role || "viewer" : "viewer";

  return {
    email: user.email,
    role: activeRole,
    requestedRole: profile?.requested_role || profile?.role || "viewer",
    approved,
    isAdmin: approved && activeRole === "admin",
    permissions: roleMeta(activeRole)
  };
}

export async function getDashboardPayload(weekId) {
  if (useDemoMode()) {
    const dataset = getDemoDataset();
    return buildPayload({
      ...dataset,
      activeWeekId: weekId || dataset.weeks.at(-1).id,
      usingDemoData: true
    });
  }

  const dataset = await getSupabaseDataset();
  return buildPayload({
    ...dataset,
    activeWeekId: weekId || dataset.weeks.at(-1)?.id,
    usingDemoData: false
  });
}

export async function submitWeeklyEntry(entry, viewer) {
  const admin = createSupabaseAdminClient();

  if (!admin) {
    return {
      ok: false,
      status: 501,
      error: "Supabase is not configured. Add env vars first."
    };
  }

  const hostelResponse = await admin.from("hostels").select("*").eq("id", entry.hostelId).single();
  if (hostelResponse.error) {
    return { ok: false, status: 400, error: hostelResponse.error.message };
  }

  const existingResponse = await admin
    .from("weekly_submissions")
    .select("*")
    .eq("week_id", entry.weekId)
    .eq("hostel_id", entry.hostelId)
    .maybeSingle();

  if (existingResponse.error) {
    return { ok: false, status: 400, error: existingResponse.error.message };
  }

  const existing = existingResponse.data || {};
  const fields = viewer.permissions?.editableFields || [];

  if (!fields.length) {
    return { ok: false, status: 403, error: "This account cannot edit weekly data." };
  }

  const population = Number(hostelResponse.data.population ?? existing.students_in_hostel ?? 1);

  const submissionPayload = {
    week_id: entry.weekId,
    hostel_id: entry.hostelId,
    students_in_hostel: population > 0 ? population : 1,
    notes: entry.notes ?? existing.notes ?? null,
    submitted_by: viewer.email || null
  };

  // Coerce and merge each editable field with any existing stored value.
  SUBMISSION_COLUMN_MAP.forEach(({ column, field, type }) => {
    const editable = fields.includes(field);
    const incoming = editable ? entry[field] : undefined;
    const previous = existing[column];

    if (type === "bool") {
      const value = incoming ?? previous ?? false;
      submissionPayload[column] = value === true || value === "true" || value === 1;
    } else {
      const raw = incoming ?? previous ?? 0;
      const parsed = Number(raw);
      submissionPayload[column] = Number.isFinite(parsed) ? parsed : 0;
    }
  });

  // mess_eating_students falls back to the hostel population when unset.
  if (!submissionPayload.mess_eating_students || submissionPayload.mess_eating_students < 1) {
    submissionPayload.mess_eating_students = submissionPayload.students_in_hostel;
  }

  const saveResponse = await admin
    .from("weekly_submissions")
    .upsert(submissionPayload, { onConflict: "week_id,hostel_id" })
    .select()
    .single();

  if (saveResponse.error) {
    return {
      ok: false,
      status: 400,
      error: saveResponse.error.message
    };
  }

  const recalc = await syncWeeklyScores(entry.weekId);

  if (!recalc.ok) {
    return recalc;
  }

  return {
    ok: true,
    data: {
      submission: saveResponse.data,
      recalculated: recalc.data
    }
  };
}

export async function syncWeeklyScores(weekId) {
  const admin = createSupabaseAdminClient();

  if (!admin) {
    return {
      ok: false,
      status: 501,
      error: "Supabase service role key is missing."
    };
  }

  const [hostelsResponse, submissionsResponse, weeksResponse] = await Promise.all([
    admin.from("hostels").select("*").order("name"),
    admin.from("weekly_submissions").select("*").eq("week_id", weekId),
    admin.from("reporting_weeks").select("*").order("starts_on")
  ]);

  if (hostelsResponse.error || submissionsResponse.error || weeksResponse.error) {
    return {
      ok: false,
      status: 400,
      error:
        hostelsResponse.error?.message ||
        submissionsResponse.error?.message ||
        weeksResponse.error?.message
    };
  }

  const weeks = weeksResponse.data;
  const currentIndex = weeks.findIndex((week) => week.id === weekId);
  const previousWeekId = currentIndex > 0 ? weeks[currentIndex - 1].id : null;

  let previousScoresByHostel = {};

  if (previousWeekId) {
    const previousScoresResponse = await admin
      .from("weekly_scores")
      .select("*")
      .eq("week_id", previousWeekId);

    if (previousScoresResponse.error) {
      return {
        ok: false,
        status: 400,
        error: previousScoresResponse.error.message
      };
    }

    previousScoresByHostel = Object.fromEntries(
      previousScoresResponse.data.map((item) => [
        item.hostel_id,
        {
          totalScore: item.total_score
        }
      ]),
    );
  }

  const hostels = hostelsResponse.data.map((item) => ({
    id: item.id,
    name: item.name,
    population: item.population
  }))
    .sort(numericHostelSort);

  const submissions = submissionsResponse.data.map((item) => {
    const mapped = {
      weekId: item.week_id,
      hostelId: item.hostel_id,
      studentsInHostel: item.students_in_hostel,
      hostelPopulation: hostels.find((hostel) => hostel.id === item.hostel_id)?.population || 1
    };
    SUBMISSION_COLUMN_MAP.forEach(({ column, field }) => {
      mapped[field] = item[column];
    });
    return mapped;
  });

  const scores = calculateWeeklyScores({
    hostels,
    submissions,
    previousScoresByHostel
  }).map((score) => ({
    week_id: weekId,
    hostel_id: score.hostelId,
    hostel_name: score.hostelName,
    rank: score.rank,
    total_score: score.totalScore,
    electricity_score: score.electricityScore,
    water_score: score.waterScore,
    waste_score: score.wasteScore,
    representation_score: score.representationScore,
    events_score: score.eventsScore,
    attendance_score: score.attendanceScore,
    extras_score: score.extrasScore,
    electricity_per_student: score.electricityPerStudent,
    mess_waste_per_student: score.messWastePerStudent,
    momentum_delta: score.momentumDelta,
    badges: score.badges,
    updated_at: new Date().toISOString()
  }));

  const deleteResponse = await admin.from("weekly_scores").delete().eq("week_id", weekId);
  if (deleteResponse.error) {
    return { ok: false, status: 400, error: deleteResponse.error.message };
  }

  const insertResponse = await admin.from("weekly_scores").insert(scores).select();
  if (insertResponse.error) {
    return { ok: false, status: 400, error: insertResponse.error.message };
  }

  return {
    ok: true,
    data: insertResponse.data
  };
}

export async function updateHostelData(items, viewer) {
  const admin = createSupabaseAdminClient();

  if (!admin) {
    return {
      ok: false,
      status: 501,
      error: "Supabase service role key is missing."
    };
  }

  if (viewer?.role !== "admin") {
    return {
      ok: false,
      status: 403,
      error: "Only admin accounts can update hostel details."
    };
  }

  const payload = items.map((item) => ({
    id: item.id,
    population: Number(item.population || 0)
  }));

  const response = await admin
    .from("hostels")
    .upsert(payload, { onConflict: "id" })
    .select("id, name, population");

  if (response.error) {
    return {
      ok: false,
      status: 400,
      error: response.error.message
    };
  }

  return {
    ok: true,
    data: response.data.sort(numericHostelSort)
  };
}
