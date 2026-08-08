import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WorkoutForm } from "@/features/workouts/components/workout-form";
import { buildDefaultCreateValues } from "@/features/workouts/components/workout-form-values";
import { formatLocalDate } from "@/lib/dates/week";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "기록하기" };

function formatLocalTime(timeZone: string, date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  return `${hour}:${minute}`;
}

export default async function RecordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .maybeSingle();

  const timezone = profile?.timezone ?? "Asia/Seoul";
  const now = new Date();
  const initial = {
    ...buildDefaultCreateValues(formatLocalDate(timezone, now)),
    localTime: formatLocalTime(timezone, now),
  };

  return (
    <div className="pt-6">
      <h1 className="text-pine-900 text-2xl font-semibold">기록하기</h1>
      <div className="mt-8">
        <WorkoutForm mode="create" initial={initial} />
      </div>
    </div>
  );
}
