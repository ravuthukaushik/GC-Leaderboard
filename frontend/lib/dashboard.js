import { getDemoDataset } from "@/lib/demo-data";
import { calculateWeeklyScores } from "@/lib/scoring";
import { round } from "@/lib/utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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
    pho: {
      label: "PHO",
      editableFields: ["wastedFoodKg", "segregationStatus", "hostelWasteKg"]
    },
    emd: {
      label: "EMD",
      editableFields: ["electricityKwh"]
    },
    admin: {
      label: "Admin",
      editableFields: [
        "electricityKwh",
        "wastedFoodKg",
        "segregationStatus",
        "hostelWasteKg",
        "eventsCount",
        "orientationAttendance"
      ]
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
  const visibleHostels = [...hostels].sort(numericHostelSort).slice(0, 5);
  const visibleHostelIds = new Set(visibleHostels.map((hostel) => hostel.id));
  const allScores = weeks.flatMap((week) =>
    (scoresByWeek[week.id] || []).filter((score) => visibleHostelIds.has(score.hostelId)),
  );
  const latestScores = (scoresByWeek[activeWeek.id] || []).filter((score) =>
    visibleHostelIds.has(score.hostelId),
  );
  const lifetimeMap = new Map(
    visibleHostels.map((hostel) => [
      hostel.id,
      {
        hostelId: hostel.id,
        name: hostel.name,
        totalScore: 0,
        electricityScore: 0,
        wasteScore: 0,
        energyScore: 0,
        weeksCount: 0,
        momentumDelta: 0,
        badges: []
      }
    ]),
  );

  allScores.forEach((score) => {
    const current = lifetimeMap.get(score.hostelId) || {
      hostelId: score.hostelId,
      name: score.hostelName,
      totalScore: 0,
      electricityScore: 0,
      wasteScore: 0,
      energyScore: 0,
      weeksCount: 0,
      momentumDelta: 0,
      badges: []
    };

    current.totalScore += Number(score.totalScore || 0);
    current.electricityScore += Number(score.electricityScore || 0);
    current.wasteScore += Number(score.wasteScore || 0);
    current.energyScore += Number(score.energyScore || 0);
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
    .map((score) => ({
      ...score,
      totalScore: round(score.weeksCount ? score.totalScore / score.weeksCount : 0),
      electricityScore: round(score.weeksCount ? score.electricityScore / score.weeksCount : 0),
      wasteScore: round(score.weeksCount ? score.wasteScore / score.weeksCount : 0),
      energyScore: round(score.weeksCount ? score.energyScore / score.weeksCount : 0)
    }))
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
    electricity: item.electricityScore,
    waste: item.wasteScore,
    energy: item.energyScore
  }));

  const bestWaste = [...leaderboard].sort((a, b) => b.wasteScore - a.wasteScore)[0] || null;
  const bestEnergy = [...leaderboard].sort((a, b) => b.energyScore - a.energyScore)[0] || null;
  const electricityLeader = [...leaderboard].sort((a, b) => b.electricityScore - a.electricityScore)[0] || null;
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
          ? `${bestWaste.name} currently has the strongest combined food waste, segregation, and hostel waste score.`
          : "Waste metrics appear once THO/PHO data is entered."
      },
      {
        label: "Events performance",
        title: bestEnergy ? `${bestEnergy.name} is driving initiatives` : "Energy engagement pending",
        description: bestEnergy
          ? `${bestEnergy.name} is leading through events and orientation participation.`
          : "Upload event and attendance data to reveal this insight."
      },
      {
        label: "Electricity efficiency",
        title: electricityLeader
          ? `${electricityLeader.name} is the electricity saver`
          : "Electricity ranking pending",
        description: electricityLeader
          ? `${electricityLeader.name} currently leads the cumulative electricity basket.`
          : "Electricity rankings will appear after the first weekly upload."
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
        wasteScore: score.waste_score,
        energyScore: score.energy_score,
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
    isAdmin: approved && ["admin", "pho", "emd"].includes(activeRole),
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

  const submissionPayload = {
    week_id: entry.weekId,
    hostel_id: entry.hostelId,
    electricity_kwh: fields.includes("electricityKwh")
      ? Number(entry.electricityKwh ?? existing.electricity_kwh ?? 0)
      : Number(existing.electricity_kwh ?? 0),
    students_in_hostel: Number(hostelResponse.data.population ?? existing.students_in_hostel ?? 1),
    wasted_food_kg: fields.includes("wastedFoodKg")
      ? Number(entry.wastedFoodKg ?? existing.wasted_food_kg ?? 0)
      : Number(existing.wasted_food_kg ?? 0),
    hostel_waste_kg: fields.includes("hostelWasteKg")
      ? Number(entry.hostelWasteKg ?? existing.hostel_waste_kg ?? 0)
      : Number(existing.hostel_waste_kg ?? 0),
    mess_diners: Number(existing.mess_diners ?? hostelResponse.data.population ?? 1),
    segregation_status: fields.includes("segregationStatus")
      ? entry.segregationStatus || existing.segregation_status || "not_segregated"
      : existing.segregation_status || "not_segregated",
    events_count: fields.includes("eventsCount")
      ? Number(entry.eventsCount ?? existing.events_count ?? 0)
      : Number(existing.events_count ?? 0),
    orientation_attendance: fields.includes("orientationAttendance")
      ? Number(entry.orientationAttendance ?? existing.orientation_attendance ?? 0)
      : Number(existing.orientation_attendance ?? 0),
    notes: entry.notes,
    submitted_by: viewer.email || null
  };

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

  const submissions = submissionsResponse.data.map((item) => ({
    weekId: item.week_id,
    hostelId: item.hostel_id,
    electricityKwh: item.electricity_kwh,
    studentsInHostel: item.students_in_hostel,
    wastedFoodKg: item.wasted_food_kg,
    hostelWasteKg: item.hostel_waste_kg,
    messDiners: item.mess_diners,
    segregationStatus: item.segregation_status,
    eventsCount: item.events_count,
    orientationAttendance: item.orientation_attendance,
    hostelPopulation: hostels.find((hostel) => hostel.id === item.hostel_id)?.population || 1
  }));

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
    waste_score: score.wasteScore,
    energy_score: score.energyScore,
    wasted_food_score: score.wastedFoodScore,
    segregation_score: score.segregationScore,
    hostel_waste_score: score.hostelWasteScore,
    events_score: score.eventsScore,
    orientation_score: score.orientationScore,
    electricity_per_student: score.electricityPerStudent,
    wasted_food_per_diner: score.wastedFoodPerDiner,
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
