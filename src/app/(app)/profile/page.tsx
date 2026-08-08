import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileAccountSection } from "@/features/auth/components/profile-account-section";
import { ProfileCard } from "@/features/auth/components/profile-card";
import { ProfilePreferencesForm } from "@/features/auth/components/profile-preferences-form";
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
    .select("nickname, avatar_url, recommendation_detail")
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

  let inquiries: Awaited<ReturnType<typeof listMyInquiries>> = [];
  try {
    inquiries = await listMyInquiries(supabase, user.id);
  } catch {
    inquiries = [];
  }

  return (
    <div className="flex flex-col gap-8 pt-6 pb-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-pine-900 text-2xl font-semibold">프로필</h1>
        <ProfileCard
          nickname={profile.nickname}
          email={user.email}
          avatarUrl={profile.avatar_url}
        />
      </div>

      <div className="flex flex-col gap-6">
        {goals ? (
          <>
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
                  이번 주 확정 목표가 없어요. 설정에서 다음 주 목표를 먼저
                  정해보세요.
                </p>
              )}
            </section>

            <ProfilePreferencesForm
              recommendationDetail={profile.recommendation_detail}
              nextWeekStart={goals.nextWeek.weekStart}
              recommendedCount={goals.nextWeek.recommendedCount}
              recommendationReason={goals.nextWeek.recommendationReason}
              confirmedCount={goals.nextWeek.targetCount}
            />
          </>
        ) : (
          <p className="text-muted text-sm">목표 정보를 불러오지 못했어요.</p>
        )}
      </div>

      <hr className="border-line" />

      <ProfileInquiriesSection inquiries={inquiries} />

      <ProfileAccountSection />
    </div>
  );
}
