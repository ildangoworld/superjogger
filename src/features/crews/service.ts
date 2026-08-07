import {
  achievementPercent,
  compareCrewBoardMembers,
  resolveCrewProgressStatus,
} from "@/features/crews/board";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/database.types";
import type {
  CrewBoardMember,
  CrewRole,
  CrewSummary,
} from "@/features/crews/types";
import {
  calculateJoggerGrade,
  type WeekOutcome,
} from "@/features/goals/grade";
import { JOGGER_GRADE_LABELS } from "@/features/goals/types";
import {
  getWeekStartDate,
  listCompletedWeekStarts,
} from "@/lib/dates/week";

type Supabase = SupabaseClient<Database>;

type BoardRpcMember = {
  user_id: string;
  nickname: string;
  avatar_url: string | null;
  role: CrewRole;
  target_count: number | null;
  qualified_day_count: number;
  first_week_start: string | null;
  week_outcomes: Array<{
    week_start: string;
    goal_count: number;
    qualified_day_count: number;
  }>;
};

type BoardRpcResult = {
  ok?: boolean;
  reason?: string;
  week_start?: string;
  members?: BoardRpcMember[];
};

function asObject(value: Json): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

export async function listMyCrews(
  supabase: Supabase,
  userId: string,
): Promise<CrewSummary[]> {
  const { data: memberships, error } = await supabase
    .from("crew_members")
    .select("crew_id, role, joined_at")
    .eq("user_id", userId)
    .order("joined_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  if (!memberships || memberships.length === 0) {
    return [];
  }

  const crewIds = memberships.map((row) => row.crew_id);
  const { data: crews, error: crewsError } = await supabase
    .from("crews")
    .select("id, name, description, invite_code, owner_id")
    .in("id", crewIds);

  if (crewsError) {
    throw new Error(crewsError.message);
  }

  const crewById = new Map((crews ?? []).map((crew) => [crew.id, crew]));
  const result: CrewSummary[] = [];

  for (const membership of memberships) {
    const crew = crewById.get(membership.crew_id);
    if (!crew) {
      continue;
    }

    const { count, error: countError } = await supabase
      .from("crew_members")
      .select("user_id", { count: "exact", head: true })
      .eq("crew_id", crew.id);

    if (countError) {
      throw new Error(countError.message);
    }

    result.push({
      id: crew.id,
      name: crew.name,
      description: crew.description,
      inviteCode: crew.invite_code,
      ownerId: crew.owner_id,
      role: membership.role,
      memberCount: count ?? 0,
    });
  }

  return result;
}

export async function getCrewBoard(
  supabase: Supabase,
  userId: string,
  crewId: string,
  timezone: string,
  now: Date = new Date(),
): Promise<{ weekStart: string; members: CrewBoardMember[] }> {
  const weekStart = getWeekStartDate(timezone, now);
  const { data, error } = await supabase.rpc("get_crew_board", {
    p_crew_id: crewId,
    p_week_start: weekStart,
  });

  if (error) {
    throw new Error(error.message);
  }

  const payload = asObject(data) as BoardRpcResult | null;
  if (!payload?.ok || !payload.members) {
    throw new Error(
      payload?.reason === "FORBIDDEN"
        ? "이 크루를 볼 권한이 없어요."
        : "크루 현황을 불러오지 못했어요.",
    );
  }

  const members: CrewBoardMember[] = payload.members.map((member) => {
    const outcomes: WeekOutcome[] = (member.week_outcomes ?? []).map(
      (row) => ({
        weekStart: row.week_start,
        goalCount: row.goal_count,
        qualifiedDayCount: row.qualified_day_count,
      }),
    );
    const firstWeekStart = member.first_week_start;
    const completedWeekStarts = firstWeekStart
      ? listCompletedWeekStarts(firstWeekStart, weekStart)
      : [];
    const grade = calculateJoggerGrade({
      completedWeekStarts,
      outcomes,
    });

    return {
      userId: member.user_id,
      nickname: member.nickname,
      avatarUrl: member.avatar_url,
      role: member.role,
      targetCount: member.target_count,
      qualifiedDayCount: member.qualified_day_count,
      achievementPercent: achievementPercent({
        targetCount: member.target_count,
        qualifiedDayCount: member.qualified_day_count,
      }),
      status: resolveCrewProgressStatus({
        targetCount: member.target_count,
        qualifiedDayCount: member.qualified_day_count,
      }),
      gradeLabel: JOGGER_GRADE_LABELS[grade.grade],
      isSelf: member.user_id === userId,
    };
  });

  members.sort(compareCrewBoardMembers);
  return { weekStart, members };
}
