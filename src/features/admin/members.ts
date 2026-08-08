import { DAILY_ANALYSIS_LIMIT } from "@/features/analysis/schema";
import type { AdminDb } from "@/features/admin/admin-db";
import {
  listAdminUserIds,
  notInUserIdsFilter,
} from "@/features/admin/admin-ids";
import {
  calculateJoggerGrade,
  type WeekOutcome,
} from "@/features/goals/grade";
import { JOGGER_GRADE_LABELS } from "@/features/goals/types";
import { listUserConsents } from "@/features/legal/queries";
import { getAiDailyLimit } from "@/features/settings/queries";
import {
  addDaysToLocalDate,
  formatLocalDate,
  getWeekStartDate,
  listCompletedWeekStarts,
} from "@/lib/dates/week";

export type AdminMemberListItem = {
  id: string;
  nickname: string;
  email: string | null;
  createdAt: string;
  onboardingCompleted: boolean;
  lastWorkoutDate: string | null;
};

export type AdminMemberDetail = {
  id: string;
  nickname: string;
  email: string | null;
  timezone: string;
  recommendationDetail: "LIGHT" | "DETAILED";
  onboardingCompleted: boolean;
  createdAt: string;
  currentGoal: {
    weekStart: string;
    targetCount: number;
    qualifiedDayCount: number;
  } | null;
  gradeLabel: string;
  gradeProvisional: boolean;
  workoutCount: number;
  aiUsageToday: number;
  aiUsageTotal: number;
  dailyAnalysisLimit: number;
  crews: Array<{
    id: string;
    name: string;
    role: "OWNER" | "MEMBER";
  }>;
  consents: Array<{
    docType: "TERMS" | "PRIVACY";
    version: number;
    consentedAt: string;
  }>;
};

async function loadAuthEmailMap(
  db: AdminDb,
): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  let page = 1;
  const perPage = 200;

  for (;;) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new Error(error.message);
    }
    for (const user of data.users) {
      map.set(user.id, user.email ?? null);
    }
    if (data.users.length < perPage) {
      break;
    }
    page += 1;
  }

  return map;
}

export async function listAdminMembers(
  db: AdminDb,
  query: string,
): Promise<AdminMemberListItem[]> {
  const q = query.trim().toLowerCase();
  const [emailMap, adminIds] = await Promise.all([
    loadAuthEmailMap(db),
    listAdminUserIds(db),
  ]);
  const excludeAdmins = notInUserIdsFilter(adminIds);

  let profileQuery = db
    .from("profiles")
    .select("id, nickname, created_at, onboarding_completed")
    .order("created_at", { ascending: false })
    .limit(200);

  if (excludeAdmins) {
    profileQuery = profileQuery.not("id", "in", excludeAdmins);
  }

  if (q) {
    profileQuery = profileQuery.ilike("nickname", `%${q}%`);
  }

  const { data: profiles, error } = await profileQuery;
  if (error) {
    throw new Error(error.message);
  }

  let rows = profiles ?? [];

  if (q) {
    const nicknameMatches = new Set(rows.map((row) => row.id));
    const emailMatches = [...emailMap.entries()]
      .filter(
        ([id, email]) =>
          !adminIds.has(id) && email?.toLowerCase().includes(q),
      )
      .map(([id]) => id);

    const missingIds = emailMatches.filter((id) => !nicknameMatches.has(id));
    if (missingIds.length > 0) {
      const { data: extra, error: extraError } = await db
        .from("profiles")
        .select("id, nickname, created_at, onboarding_completed")
        .in("id", missingIds);
      if (extraError) {
        throw new Error(extraError.message);
      }
      rows = [...rows, ...(extra ?? [])];
    }
  }

  const ids = rows.map((row) => row.id);
  const lastWorkoutByUser = new Map<string, string>();

  if (ids.length > 0) {
    const { data: workouts, error: workoutError } = await db
      .from("workouts")
      .select("user_id, local_date")
      .in("user_id", ids)
      .order("local_date", { ascending: false });

    if (workoutError) {
      throw new Error(workoutError.message);
    }

    for (const workout of workouts ?? []) {
      if (!lastWorkoutByUser.has(workout.user_id)) {
        lastWorkoutByUser.set(workout.user_id, workout.local_date);
      }
    }
  }

  return rows
    .map((row) => ({
      id: row.id,
      nickname: row.nickname,
      email: emailMap.get(row.id) ?? null,
      createdAt: row.created_at,
      onboardingCompleted: row.onboarding_completed,
      lastWorkoutDate: lastWorkoutByUser.get(row.id) ?? null,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getAdminMemberDetail(
  db: AdminDb,
  userId: string,
): Promise<AdminMemberDetail | null> {
  const adminIds = await listAdminUserIds(db);
  if (adminIds.has(userId)) {
    return null;
  }

  const { data: profile, error } = await db
    .from("profiles")
    .select(
      "id, nickname, timezone, recommendation_detail, onboarding_completed, created_at",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!profile) {
    return null;
  }

  const { data: authUser, error: authError } =
    await db.auth.admin.getUserById(userId);
  if (authError) {
    throw new Error(authError.message);
  }

  const weekStart = getWeekStartDate(profile.timezone);
  const usageLocalDate = formatLocalDate(profile.timezone);

  const [
    goalResult,
    summariesResult,
    goalsHistoryResult,
    workoutCountResult,
    aiTodayResult,
    aiTotalResult,
    membershipResult,
    consents,
  ] = await Promise.all([
    db
      .from("weekly_goals")
      .select("week_start, target_count")
      .eq("user_id", userId)
      .eq("week_start", weekStart)
      .maybeSingle(),
    db
      .from("weekly_summaries")
      .select("week_start, goal_count, qualified_day_count")
      .eq("user_id", userId),
    db
      .from("weekly_goals")
      .select("week_start, target_count")
      .eq("user_id", userId)
      .order("week_start", { ascending: true }),
    db
      .from("workouts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    db
      .from("ai_analysis_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("usage_local_date", usageLocalDate)
      .in("status", ["RESERVED", "CONSUMED"]),
    db
      .from("ai_analysis_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "CONSUMED"),
    db
      .from("crew_members")
      .select("crew_id, role")
      .eq("user_id", userId),
    listUserConsents(db, userId),
  ]);

  if (goalResult.error) {
    throw new Error(goalResult.error.message);
  }
  if (summariesResult.error) {
    throw new Error(summariesResult.error.message);
  }
  if (goalsHistoryResult.error) {
    throw new Error(goalsHistoryResult.error.message);
  }
  if (workoutCountResult.error) {
    throw new Error(workoutCountResult.error.message);
  }
  if (aiTodayResult.error) {
    throw new Error(aiTodayResult.error.message);
  }
  if (aiTotalResult.error) {
    throw new Error(aiTotalResult.error.message);
  }
  if (membershipResult.error) {
    throw new Error(membershipResult.error.message);
  }

  let qualifiedDayCount = 0;
  if (goalResult.data) {
    const summary = (summariesResult.data ?? []).find(
      (row) => row.week_start === weekStart,
    );
    if (summary) {
      qualifiedDayCount = summary.qualified_day_count;
    } else {
      const weekEnd = addDaysToLocalDate(weekStart, 6);
      const { data: days, error: daysError } = await db
        .from("workouts")
        .select("local_date")
        .eq("user_id", userId)
        .eq("counts_for_daily_goal", true)
        .gte("local_date", weekStart)
        .lte("local_date", weekEnd);
      if (daysError) {
        throw new Error(daysError.message);
      }
      qualifiedDayCount = new Set((days ?? []).map((row) => row.local_date))
        .size;
    }
  }

  const summaryByWeek = new Map(
    (summariesResult.data ?? []).map((row) => [row.week_start, row]),
  );
  const outcomes: WeekOutcome[] = [];
  for (const goal of goalsHistoryResult.data ?? []) {
    const summary = summaryByWeek.get(goal.week_start);
    outcomes.push({
      weekStart: goal.week_start,
      goalCount: goal.target_count,
      qualifiedDayCount: summary?.qualified_day_count ?? 0,
    });
  }

  const firstWeekStart = goalsHistoryResult.data?.[0]?.week_start ?? null;
  const completedWeekStarts = firstWeekStart
    ? listCompletedWeekStarts(firstWeekStart, weekStart)
    : [];
  const grade = calculateJoggerGrade({
    completedWeekStarts,
    outcomes,
  });

  const memberships = membershipResult.data ?? [];
  const crewIds = memberships.map((row) => row.crew_id);
  const crewNameById = new Map<string, string>();

  if (crewIds.length > 0) {
    const { data: crews, error: crewsError } = await db
      .from("crews")
      .select("id, name")
      .in("id", crewIds);
    if (crewsError) {
      throw new Error(crewsError.message);
    }
    for (const crew of crews ?? []) {
      crewNameById.set(crew.id, crew.name);
    }
  }

  const crews: AdminMemberDetail["crews"] = memberships
    .map((row) => {
      const name = crewNameById.get(row.crew_id);
      if (!name) {
        return null;
      }
      return {
        id: row.crew_id,
        name,
        role: row.role,
      };
    })
    .filter((row): row is AdminMemberDetail["crews"][number] => row != null);

  return {
    id: profile.id,
    nickname: profile.nickname,
    email: authUser.user.email ?? null,
    timezone: profile.timezone,
    recommendationDetail: profile.recommendation_detail,
    onboardingCompleted: profile.onboarding_completed,
    createdAt: profile.created_at,
    currentGoal: goalResult.data
      ? {
          weekStart: goalResult.data.week_start,
          targetCount: goalResult.data.target_count,
          qualifiedDayCount,
        }
      : null,
    gradeLabel: JOGGER_GRADE_LABELS[grade.grade],
    gradeProvisional: grade.isProvisional,
    workoutCount: workoutCountResult.count ?? 0,
    aiUsageToday: aiTodayResult.count ?? 0,
    aiUsageTotal: aiTotalResult.count ?? 0,
    dailyAnalysisLimit:
      (await getAiDailyLimit(db).catch(() => DAILY_ANALYSIS_LIMIT)),
    crews,
    consents: consents.map((consent) => ({
      docType: consent.docType,
      version: consent.version,
      consentedAt: consent.consentedAt,
    })),
  };
}
