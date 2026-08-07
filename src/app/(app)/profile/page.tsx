import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileSettingsForm } from "@/features/auth/components/profile-settings-form";
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

  return (
    <div className="pt-6">
      <h1 className="text-pine-900 text-2xl font-semibold">프로필</h1>
      <p className="text-muted mt-2 text-sm leading-6">
        닉네임과 AI 추천 방식을 관리할 수 있어요.
      </p>
      <div className="mt-8">
        <ProfileSettingsForm
          nickname={profile.nickname}
          recommendationDetail={profile.recommendation_detail}
          email={user.email}
        />
      </div>
    </div>
  );
}
