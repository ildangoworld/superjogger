import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getHomeDashboard } from "@/features/goals/service";
import { formatCategory } from "@/features/workouts/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "홈" };

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let dashboard;
  try {
    dashboard = await getHomeDashboard(supabase, user.id);
  } catch {
    return (
      <p className="text-muted mt-8 text-sm">
        홈 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
      </p>
    );
  }

  const { progress, nextDirection, latestWorkout, grade, gradeLabel, nickname } =
    dashboard;

  return (
    <div className="flex flex-col gap-10 pt-6 pb-4">
      <section>
        <p className="text-pine-600 text-sm font-medium">안녕하세요, {nickname}님</p>
        <h1 className="text-pine-900 mt-2 text-2xl font-semibold">이번 주</h1>

        {progress ? (
          <div className="mt-5">
            <p className="text-pine-900 text-4xl font-semibold tracking-tight">
              {progress.qualifiedDayCount}
              <span className="text-pine-500 text-2xl font-medium">
                /{progress.targetCount}회
              </span>
            </p>
            <p className="text-muted mt-2 text-sm leading-6">
              {progress.goalAchieved
                ? "이번 주 목표를 달성했어요. 더 채우기보다 지금의 리듬을 이어가세요."
                : `목표까지 ${Math.max(0, progress.targetCount - progress.qualifiedDayCount)}회 남았어요.`}
            </p>
            <div className="bg-fog-200 mt-4 h-1.5 w-full overflow-hidden rounded-full">
              <div
                className="bg-pine-600 h-full rounded-full transition-[width] duration-500"
                style={{ width: `${progress.achievementPercent}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="text-muted mt-4 text-sm leading-6">
            이번 주 목표가 아직 없어요. 프로필에서 다음 주 목표를 먼저 확정할 수
            있어요.
          </p>
        )}
      </section>

      <section>
        <h2 className="text-pine-900 text-lg font-semibold">다음 운동</h2>
        <p className="text-pine-800 mt-3 text-base font-medium">
          {nextDirection.headline}
        </p>
        <p className="text-muted mt-2 text-sm leading-6">{nextDirection.body}</p>
      </section>

      <section>
        <Link
          href="/record"
          className="bg-pine-800 text-fog-50 hover:bg-pine-700 flex h-12 items-center justify-center rounded-lg text-base font-semibold transition-colors"
        >
          오늘 운동 기록하기
        </Link>
      </section>

      <section>
        <h2 className="text-pine-900 text-lg font-semibold">최근 운동</h2>
        {latestWorkout ? (
          <div className="mt-3">
            <p className="text-pine-900 text-sm font-medium">
              {formatCategory(latestWorkout.category)} · {latestWorkout.localDate}
            </p>
            <p className="text-muted mt-2 text-sm leading-6">
              {latestWorkout.analysisSummary ??
                "저장한 기록의 상세 분석은 기록 화면에서 확인할 수 있어요."}
            </p>
            <Link
              href={`/workouts/${latestWorkout.id}`}
              className="text-pine-700 mt-3 inline-flex text-sm font-medium underline-offset-4 hover:underline"
            >
              기록 자세히 보기
            </Link>
          </div>
        ) : (
          <p className="text-muted mt-3 text-sm leading-6">
            아직 최근 기록이 없어요. 오늘 몸에 맞게 10분부터 남겨보세요.
          </p>
        )}
      </section>

      <section className="border-line border-t pt-8">
        <h2 className="text-pine-900 text-lg font-semibold">조거 등급</h2>
        <p className="text-pine-900 mt-3 text-2xl font-semibold">{gradeLabel}</p>
        <p className="text-muted mt-2 text-sm leading-6">{grade.explanation}</p>
        {grade.achievementRate != null ? (
          <p className="text-pine-700 mt-2 text-sm">
            달성률 {grade.achievementRate}%
            {grade.isProvisional ? " · 임시 등급" : ""}
          </p>
        ) : null}
      </section>
    </div>
  );
}
