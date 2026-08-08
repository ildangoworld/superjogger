import { DAILY_ANALYSIS_LIMIT } from "@/features/analysis/schema";
import type { AdminDb } from "@/features/admin/admin-db";
import { listRecentAdminInquiries } from "@/features/inquiries/queries";
import { getAiDailyLimit } from "@/features/settings/queries";
import {
  addDaysToLocalDate,
  formatLocalDate,
} from "@/lib/dates/week";

const ADMIN_TZ = "Asia/Seoul";

export type DashboardMetrics = {
  totalMembers: number;
  newMembersToday: number;
  newMembersLast7Days: number;
  workoutsToday: number;
  activeWritersLast7Days: number;
  aiSuccessToday: number;
  aiFailedToday: number;
  aiLimitReachedToday: number;
  dailyAnalysisLimit: number;
  recentMembers: Array<{
    id: string;
    nickname: string;
    createdAt: string;
  }>;
  recentInquiries: Array<{
    id: string;
    title: string;
    status: "OPEN" | "ANSWERED" | "CLOSED";
    createdAt: string;
    authorNickname: string;
  }>;
};

function startOfDayIso(localDate: string): string {
  return `${localDate}T00:00:00+09:00`;
}

export async function getDashboardMetrics(
  db: AdminDb,
): Promise<DashboardMetrics> {
  const today = formatLocalDate(ADMIN_TZ);
  const weekAgo = addDaysToLocalDate(today, -6);
  const todayStartIso = startOfDayIso(today);
  const weekStartIso = startOfDayIso(weekAgo);

  const [
    totalMembersResult,
    newTodayResult,
    newWeekResult,
    workoutsTodayResult,
    activeWritersResult,
    aiUsageResult,
    recentMembersResult,
    recentInquiries,
    dailyAnalysisLimit,
  ] = await Promise.all([
    db.from("profiles").select("id", { count: "exact", head: true }),
    db
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStartIso),
    db
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekStartIso),
    db
      .from("workouts")
      .select("id", { count: "exact", head: true })
      .eq("local_date", today),
    db
      .from("workouts")
      .select("user_id")
      .gte("local_date", weekAgo)
      .lte("local_date", today),
    db
      .from("ai_analysis_usage")
      .select("user_id, status")
      .eq("usage_local_date", today),
    db
      .from("profiles")
      .select("id, nickname, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    listRecentAdminInquiries(db, 5).catch(() => []),
    getAiDailyLimit(db).catch(() => DAILY_ANALYSIS_LIMIT),
  ]);

  if (totalMembersResult.error) {
    throw new Error(totalMembersResult.error.message);
  }
  if (newTodayResult.error) {
    throw new Error(newTodayResult.error.message);
  }
  if (newWeekResult.error) {
    throw new Error(newWeekResult.error.message);
  }
  if (workoutsTodayResult.error) {
    throw new Error(workoutsTodayResult.error.message);
  }
  if (activeWritersResult.error) {
    throw new Error(activeWritersResult.error.message);
  }
  if (aiUsageResult.error) {
    throw new Error(aiUsageResult.error.message);
  }
  if (recentMembersResult.error) {
    throw new Error(recentMembersResult.error.message);
  }

  const activeWritersLast7Days = new Set(
    (activeWritersResult.data ?? []).map((row) => row.user_id),
  ).size;

  const usageByUser = new Map<string, number>();
  let aiSuccessToday = 0;
  let aiFailedToday = 0;

  for (const row of aiUsageResult.data ?? []) {
    if (row.status === "CONSUMED") {
      aiSuccessToday += 1;
      usageByUser.set(row.user_id, (usageByUser.get(row.user_id) ?? 0) + 1);
    } else if (row.status === "RELEASED") {
      aiFailedToday += 1;
    } else if (row.status === "RESERVED") {
      usageByUser.set(row.user_id, (usageByUser.get(row.user_id) ?? 0) + 1);
    }
  }

  let aiLimitReachedToday = 0;
  for (const count of usageByUser.values()) {
    if (count >= dailyAnalysisLimit) {
      aiLimitReachedToday += 1;
    }
  }

  return {
    totalMembers: totalMembersResult.count ?? 0,
    newMembersToday: newTodayResult.count ?? 0,
    newMembersLast7Days: newWeekResult.count ?? 0,
    workoutsToday: workoutsTodayResult.count ?? 0,
    activeWritersLast7Days,
    aiSuccessToday,
    aiFailedToday,
    aiLimitReachedToday,
    dailyAnalysisLimit,
    recentMembers: (recentMembersResult.data ?? []).map((row) => ({
      id: row.id,
      nickname: row.nickname,
      createdAt: row.created_at,
    })),
    recentInquiries: recentInquiries.map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      createdAt: row.createdAt,
      authorNickname: row.authorNickname,
    })),
  };
}
