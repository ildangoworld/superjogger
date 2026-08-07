import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  buildEditValues,
  WorkoutForm,
} from "@/features/workouts/components/workout-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "기록 수정" };

function formatLocalTimeFromStartedAt(
  startedAtIso: string,
  timeZone: string,
): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(startedAtIso));
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  return `${hour}:${minute}`;
}

export default async function EditWorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: workout }, { data: profile }] = await Promise.all([
    supabase
      .from("workouts")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("timezone")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  if (!workout) {
    notFound();
  }

  const timezone = profile?.timezone ?? "Asia/Seoul";
  const initial = buildEditValues({
    category: workout.category,
    localDate: workout.local_date,
    localTime: formatLocalTimeFromStartedAt(workout.started_at, timezone),
    distanceMeters: workout.distance_meters,
    durationSeconds: workout.duration_seconds,
    perceivedExertion: workout.perceived_exertion,
    conditionScore: workout.condition_score,
    hasPain: workout.has_pain,
    painArea: workout.pain_area,
    painDetails: workout.pain_details,
    averageHeartRate: workout.average_heart_rate,
    cadence: workout.cadence,
    stepCount: workout.step_count,
    memo: workout.memo,
  });

  return (
    <div className="pt-6">
      <p className="text-muted text-sm">
        <Link href={`/workouts/${workout.id}`} className="hover:underline">
          상세
        </Link>
        <span aria-hidden> / </span>
        수정
      </p>
      <h1 className="text-pine-900 mt-3 text-2xl font-semibold">기록 수정</h1>
      <p className="text-muted mt-2 text-sm leading-6">
        수정하면 목표 반영이 다시 계산돼요. AI 분석은 자동으로 다시 하지
        않아요.
      </p>
      <div className="mt-8">
        <WorkoutForm mode="edit" workoutId={workout.id} initial={initial} />
      </div>
    </div>
  );
}
