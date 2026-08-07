import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/features/auth/components/onboarding-form";
import { Wordmark } from "@/components/brand/wordmark";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "온보딩" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.onboarding_completed) {
    await supabase.auth.updateUser({
      data: { onboarding_completed: true },
    });
    redirect("/");
  }

  return (
    <div className="atmosphere flex min-h-dvh flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-8">
        <Wordmark className="text-lg" />
        <div className="mt-8">
          <OnboardingForm initialNickname={profile?.nickname ?? ""} />
        </div>
      </div>
    </div>
  );
}
