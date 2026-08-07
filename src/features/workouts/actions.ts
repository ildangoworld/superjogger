"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  markActiveAnalysisStale,
  runWorkoutAnalysis,
} from "@/features/analysis/run-analysis";
import { hasCoreAnalysisFieldsChanged } from "@/features/analysis/stale";
import { getRemainingAnalysisSlots } from "@/features/analysis/usage";
import {
  durationPartsToSeconds,
  kilometersToMeters,
} from "@/features/workouts/qualification";
import { workoutInputSchema } from "@/features/workouts/schemas";
import {
  computeQualificationFlags,
  reassignDailyGoalFlags,
  refreshWeeklySummaries,
} from "@/features/workouts/service";
import { formatLocalDate } from "@/lib/dates/week";
import { isFutureLocalDate, zonedLocalToUtcIso } from "@/lib/dates/zoned";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export type WorkoutActionResult = {
  ok: boolean;
  message?: string;
  warning?: string;
  workoutId?: string;
  countedForGoal?: boolean;
  qualifiesByRule?: boolean;
};

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function formOptionalNumber(formData: FormData, key: string): number | null {
  const raw = formString(formData, key).trim();
  if (!raw) {
    return null;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function parseWorkoutForm(formData: FormData) {
  return workoutInputSchema.safeParse({
    category: formString(formData, "category") || "RUNNING",
    localDate: formString(formData, "localDate"),
    localTime: formString(formData, "localTime"),
    distanceKm: formString(formData, "distanceKm"),
    hours: formString(formData, "hours") || "0",
    minutes: formString(formData, "minutes") || "0",
    seconds: formString(formData, "seconds") || "0",
    perceivedExertion: formString(formData, "perceivedExertion"),
    conditionScore: formString(formData, "conditionScore"),
    hasPain: formString(formData, "hasPain") === "true",
    painArea: formString(formData, "painArea") || null,
    painDetails: formString(formData, "painDetails") || null,
    averageHeartRate: formOptionalNumber(formData, "averageHeartRate"),
    cadence: formOptionalNumber(formData, "cadence"),
    stepCount: formOptionalNumber(formData, "stepCount"),
    memo: formString(formData, "memo") || null,
  });
}

async function requireUserContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요해요." as const };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    return { error: "프로필을 불러오지 못했어요." as const };
  }

  return { supabase, user, timezone: profile.timezone };
}

export async function createWorkout(
  _prev: WorkoutActionResult,
  formData: FormData,
): Promise<WorkoutActionResult> {
  const parsed = parseWorkoutForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.",
    };
  }

  const context = await requireUserContext();
  if ("error" in context) {
    return { ok: false, message: context.error };
  }

  const { supabase, user, timezone } = context;
  const input = parsed.data;
  const todayLocal = formatLocalDate(timezone);
  if (isFutureLocalDate(input.localDate, todayLocal)) {
    return { ok: false, message: "미래 날짜의 운동은 등록할 수 없어요." };
  }

  const startedAtIso = zonedLocalToUtcIso(
    input.localDate,
    input.localTime,
    timezone,
  );
  if (new Date(startedAtIso).getTime() > Date.now()) {
    return { ok: false, message: "미래 시각의 운동은 등록할 수 없어요." };
  }

  const durationSeconds = durationPartsToSeconds(
    input.hours,
    input.minutes,
    input.seconds,
  );
  const distanceMeters = kilometersToMeters(input.distanceKm);

  const { data: sameDay, error: sameDayError } = await supabase
    .from("workouts")
    .select(
      "id, qualifies_by_rule, counts_for_daily_goal, created_at, duration_seconds, distance_meters",
    )
    .eq("user_id", user.id)
    .eq("local_date", input.localDate);

  if (sameDayError) {
    return { ok: false, message: sameDayError.message };
  }

  const flags = computeQualificationFlags({
    durationSeconds,
    distanceMeters,
    localDate: input.localDate,
    existingSameDay: sameDay ?? [],
  });

  const similar = (sameDay ?? []).some(
    (row) =>
      row.duration_seconds === durationSeconds &&
      row.distance_meters === distanceMeters,
  );

  const { data: created, error: insertError } = await supabase
    .from("workouts")
    .insert({
      user_id: user.id,
      category: input.category,
      started_at: startedAtIso,
      local_date: input.localDate,
      duration_seconds: durationSeconds,
      distance_meters: distanceMeters,
      perceived_exertion: input.perceivedExertion,
      condition_score: input.conditionScore,
      has_pain: input.hasPain,
      pain_area: input.hasPain ? input.painArea : null,
      pain_details: input.hasPain ? input.painDetails : null,
      average_heart_rate: input.averageHeartRate,
      cadence: input.cadence,
      step_count: input.stepCount,
      memo: input.memo,
      qualifies_by_rule: flags.qualifiesByRule,
      counts_for_daily_goal: flags.countsForDailyGoal,
    })
    .select("id")
    .single();

  if (insertError || !created) {
    return {
      ok: false,
      message: insertError?.message ?? "운동 기록을 저장하지 못했어요.",
    };
  }

  try {
    await reassignDailyGoalFlags(supabase, user.id, [input.localDate]);
    await refreshWeeklySummaries(supabase, user.id, [input.localDate]);
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "목표 반영을 갱신하지 못했어요.",
    };
  }

  revalidatePath("/workouts");
  revalidatePath("/");
  revalidatePath("/record");

  const remaining = await getRemainingAnalysisSlots(
    supabase,
    user.id,
    formatLocalDate(timezone),
  );

  if (remaining > 0) {
    const workoutId = created.id;
    const userId = user.id;
    const userTimezone = timezone;
    after(async () => {
      try {
        const admin = createServiceRoleClient();
        await runWorkoutAnalysis({
          supabase: admin,
          userId,
          workoutId,
          timezone: userTimezone,
          triggerType: "AUTO",
          requestKey: `auto:${workoutId}`,
        });
        revalidatePath(`/workouts/${workoutId}`);
        revalidatePath("/workouts");
        revalidatePath("/");
      } catch {
        // Analysis must never undo a successful workout save.
      }
    });
  }

  const analysisQuery = remaining > 0 ? "" : "&analysis=limit";
  redirect(
    `/workouts/${created.id}?saved=1${similar ? "&similar=1" : ""}${analysisQuery}`,
  );
}

export async function updateWorkout(
  _prev: WorkoutActionResult,
  formData: FormData,
): Promise<WorkoutActionResult> {
  const workoutId = formString(formData, "workoutId");
  if (!workoutId) {
    return { ok: false, message: "운동 기록을 찾지 못했어요." };
  }

  const parsed = parseWorkoutForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.",
    };
  }

  const context = await requireUserContext();
  if ("error" in context) {
    return { ok: false, message: context.error };
  }

  const { supabase, user, timezone } = context;
  const input = parsed.data;

  const { data: existing, error: existingError } = await supabase
    .from("workouts")
    .select(
      "id, local_date, created_at, category, duration_seconds, distance_meters, perceived_exertion, condition_score, has_pain, pain_area, pain_details, average_heart_rate, active_analysis_id",
    )
    .eq("id", workoutId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError || !existing) {
    return { ok: false, message: "운동 기록을 찾지 못했어요." };
  }

  const todayLocal = formatLocalDate(timezone);
  if (isFutureLocalDate(input.localDate, todayLocal)) {
    return { ok: false, message: "미래 날짜의 운동은 등록할 수 없어요." };
  }

  const startedAtIso = zonedLocalToUtcIso(
    input.localDate,
    input.localTime,
    timezone,
  );
  if (new Date(startedAtIso).getTime() > Date.now()) {
    return { ok: false, message: "미래 시각의 운동은 등록할 수 없어요." };
  }

  const durationSeconds = durationPartsToSeconds(
    input.hours,
    input.minutes,
    input.seconds,
  );
  const distanceMeters = kilometersToMeters(input.distanceKm);

  const { data: sameDay, error: sameDayError } = await supabase
    .from("workouts")
    .select("id, qualifies_by_rule, counts_for_daily_goal, created_at")
    .eq("user_id", user.id)
    .eq("local_date", input.localDate);

  if (sameDayError) {
    return { ok: false, message: sameDayError.message };
  }

  const flags = computeQualificationFlags({
    durationSeconds,
    distanceMeters,
    localDate: input.localDate,
    existingSameDay: sameDay ?? [],
    workoutId,
    createdAt: existing.created_at,
  });

  const { error: updateError } = await supabase
    .from("workouts")
    .update({
      category: input.category,
      started_at: startedAtIso,
      local_date: input.localDate,
      duration_seconds: durationSeconds,
      distance_meters: distanceMeters,
      perceived_exertion: input.perceivedExertion,
      condition_score: input.conditionScore,
      has_pain: input.hasPain,
      pain_area: input.hasPain ? input.painArea : null,
      pain_details: input.hasPain ? input.painDetails : null,
      average_heart_rate: input.averageHeartRate,
      cadence: input.cadence,
      step_count: input.stepCount,
      memo: input.memo,
      qualifies_by_rule: flags.qualifiesByRule,
      counts_for_daily_goal: flags.countsForDailyGoal,
    })
    .eq("id", workoutId)
    .eq("user_id", user.id);

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  const coreChanged = hasCoreAnalysisFieldsChanged(
    {
      category: existing.category,
      localDate: existing.local_date,
      durationSeconds: existing.duration_seconds,
      distanceMeters: existing.distance_meters,
      perceivedExertion: existing.perceived_exertion,
      conditionScore: existing.condition_score,
      hasPain: existing.has_pain,
      painArea: existing.pain_area,
      painDetails: existing.pain_details,
      averageHeartRate: existing.average_heart_rate,
    },
    {
      category: input.category,
      localDate: input.localDate,
      durationSeconds,
      distanceMeters,
      perceivedExertion: input.perceivedExertion,
      conditionScore: input.conditionScore,
      hasPain: input.hasPain,
      painArea: input.hasPain ? (input.painArea ?? null) : null,
      painDetails: input.hasPain ? (input.painDetails ?? null) : null,
      averageHeartRate: input.averageHeartRate ?? null,
    },
  );

  if (coreChanged && existing.active_analysis_id) {
    await markActiveAnalysisStale(supabase, user.id, workoutId);
  }

  try {
    await reassignDailyGoalFlags(supabase, user.id, [
      existing.local_date,
      input.localDate,
    ]);
    await refreshWeeklySummaries(supabase, user.id, [
      existing.local_date,
      input.localDate,
    ]);
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "목표 반영을 갱신하지 못했어요.",
    };
  }

  revalidatePath("/workouts");
  revalidatePath(`/workouts/${workoutId}`);
  revalidatePath("/");

  redirect(`/workouts/${workoutId}?updated=1`);
}

export async function deleteWorkout(
  _prev: WorkoutActionResult,
  formData: FormData,
): Promise<WorkoutActionResult> {
  const workoutId = formString(formData, "workoutId");
  if (!workoutId) {
    return { ok: false, message: "운동 기록을 찾지 못했어요." };
  }

  const context = await requireUserContext();
  if ("error" in context) {
    return { ok: false, message: context.error };
  }

  const { supabase, user } = context;

  const { data: existing, error: existingError } = await supabase
    .from("workouts")
    .select("id, local_date")
    .eq("id", workoutId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError || !existing) {
    return { ok: false, message: "운동 기록을 찾지 못했어요." };
  }

  const { error: deleteError } = await supabase
    .from("workouts")
    .delete()
    .eq("id", workoutId)
    .eq("user_id", user.id);

  if (deleteError) {
    return { ok: false, message: deleteError.message };
  }

  try {
    await reassignDailyGoalFlags(supabase, user.id, [existing.local_date]);
    await refreshWeeklySummaries(supabase, user.id, [existing.local_date]);
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "목표 반영을 갱신하지 못했어요.",
    };
  }

  revalidatePath("/workouts");
  revalidatePath("/");
  redirect("/workouts?deleted=1");
}
