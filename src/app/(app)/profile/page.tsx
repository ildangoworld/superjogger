import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileSettingsForm } from "@/features/auth/components/profile-settings-form";
import { listMyCrews } from "@/features/crews/service";
import { NextWeekGoalForm } from "@/features/goals/components/next-week-goal-form";
import { getGoalsSettings } from "@/features/goals/service";
import { ProfileInquiriesSection } from "@/features/inquiries/components/profile-inquiries-section";
import { listMyInquiries } from "@/features/inquiries/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "프로필" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname, recommendation_detail")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return (
      <p className="text-muted mt-8 text-sm">
        프로필을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
      </p>
    );
  }

  let goals;
  try {
    goals = await getGoalsSettings(supabase, user.id);
  } catch {
    goals = null;
  }

  let crews: Awaited<ReturnType<typeof listMyCrews>> = [];
  try {
    crews = await listMyCrews(supabase, user.id);
  } catch {
    crews = [];
  }

  let inquiries: Awaited<ReturnType<typeof listMyInquiries>> = [];
  try {
    inquiries = await listMyInquiries(supabase, user.id);
  } catch {
    inquiries = [];
  }

  return (
    <div className="flex flex-col gap-10 pt-6 pb-8">
      <div>
        <h1 className="text-pine-900 text-2xl font-semibold">프로필</h1>
        <p className="text-muted mt-2 text-sm leading-6">
          닉네임, 목표, AI 추천 방식을 관리할 수 있어요.
        </p>
      </div>

      {goals ? (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="text-pine-900 text-lg font-semibold">조거 등급</h2>
            <p className="text-pine-900 text-xl font-semibold">
              {goals.gradeLabel}
            </p>
            <p className="text-muted text-sm leading-6">
              {goals.grade.explanation}
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-pine-900 text-lg font-semibold">이번 주 목표</h2>
            {goals.currentWeek ? (
              <>
                <p className="text-pine-900 text-2xl font-semibold">
                  {goals.currentWeek.qualifiedDayCount}/
                  {goals.currentWeek.targetCount}회
                </p>
                <p className="text-muted text-sm leading-6">
                  이번 주 목표는 확인만 가능하고, 낮추는 변경은 다음 주부터
                  적용돼요.
                </p>
              </>
            ) : (
              <p className="text-muted text-sm leading-6">
                이번 주 확정 목표가 없어요. 아래 다음 주 목표를 먼저
                정해보세요.
              </p>
            )}
          </section>

          <NextWeekGoalForm
            nextWeekStart={goals.nextWeek.weekStart}
            recommendedCount={goals.nextWeek.recommendedCount}
            recommendationReason={goals.nextWeek.recommendationReason}
            confirmedCount={goals.nextWeek.targetCount}
          />
        </>
      ) : (
        <p className="text-muted text-sm">목표 정보를 불러오지 못했어요.</p>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-pine-900 text-lg font-semibold">가입 크루</h2>
        {crews.length === 0 ? (
          <p className="text-muted text-sm leading-6">
            아직 가입한 크루가 없어요.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {crews.map((crew) => (
              <li key={crew.id}>
                <Link
                  href={`/crews?crew=${crew.id}`}
                  className="text-pine-800 text-sm font-medium underline-offset-4 hover:underline"
                >
                  {crew.name}
                  <span className="text-muted ml-2 font-normal">
                    {crew.memberCount}명
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/crews"
          className="text-pine-700 text-sm font-medium underline-offset-4 hover:underline"
        >
          크루 현황으로 이동
        </Link>
      </section>

      <ProfileInquiriesSection inquiries={inquiries} />

      <ProfileSettingsForm
        nickname={profile.nickname}
        recommendationDetail={profile.recommendation_detail}
        email={user.email}
      />
    </div>
  );
}
