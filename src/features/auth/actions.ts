"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdminOnlyAuthUser } from "@/features/admin/credentials";
import { ACCOUNT_DELETION_POLICY } from "@/features/auth/account-deletion";
import {
  forgotPasswordSchema,
  loginSchema,
  onboardingSchema,
  profileUpdateSchema,
  resetPasswordSchema,
  signupSchema,
} from "@/features/auth/schemas";
import { recommendWeeklyTarget } from "@/features/goals/recommend";
import { recordUserConsents } from "@/features/legal/queries";
import { getWeekStartDate } from "@/lib/dates/week";
import { getAppUrl } from "@/lib/supabase/env";
import {
  createClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";

export type ActionResult = {
  ok: boolean;
  message?: string;
};

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function formChecked(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "on" || value === "true" || value === "1";
}

export async function signUpWithEmail(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = signupSchema.safeParse({
    email: formString(formData, "email"),
    password: formString(formData, "password"),
    confirmPassword: formString(formData, "confirmPassword"),
    agreeTerms: formChecked(formData, "agreeTerms"),
    agreePrivacy: formChecked(formData, "agreePrivacy"),
    termsVersion: formString(formData, "termsVersion"),
    privacyVersion: formString(formData, "privacyVersion"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.",
    };
  }

  if (isAdminOnlyAuthUser({ email: parsed.data.email })) {
    return {
      ok: false,
      message: "관리자 계정은 사용자 사이트에 가입할 수 없어요.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${getAppUrl()}/auth/callback?next=/onboarding`,
      data: {
        consent_terms_version: parsed.data.termsVersion,
        consent_privacy_version: parsed.data.privacyVersion,
      },
    },
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  if (data.user) {
    try {
      await recordUserConsents({
        userId: data.user.id,
        termsVersion: parsed.data.termsVersion,
        privacyVersion: parsed.data.privacyVersion,
        client: data.session ? supabase : createServiceRoleClient(),
      });
    } catch (consentError) {
      return {
        ok: false,
        message:
          consentError instanceof Error
            ? consentError.message
            : "동의 기록을 저장하지 못했어요.",
      };
    }
  }

  if (data.session) {
    redirect("/onboarding");
  }

  return {
    ok: true,
    message: "가입 확인 메일을 보냈어요. 메일함에서 인증을 완료해 주세요.",
  };
}

export async function signInWithEmail(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formString(formData, "email"),
    password: formString(formData, "password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { ok: false, message: "이메일 또는 비밀번호가 올바르지 않아요." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "로그인에 실패했어요. 다시 시도해 주세요." };
  }

  if (isAdminOnlyAuthUser(user)) {
    await supabase.auth.signOut();
    return {
      ok: false,
      message: "관리자 계정은 사용자 사이트에 로그인할 수 없어요.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.onboarding_completed) {
    await supabase.auth.updateUser({
      data: { onboarding_completed: true },
    });
    redirect("/");
  }

  redirect("/onboarding");
}

export async function requestPasswordReset(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formString(formData, "email"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "이메일을 확인해 주세요.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: `${getAppUrl()}/auth/callback?next=/reset-password`,
    },
  );

  if (error) {
    return { ok: false, message: error.message };
  }

  return {
    ok: true,
    message: "비밀번호 재설정 링크를 이메일로 보냈어요.",
  };
}

export async function updatePassword(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    password: formString(formData, "password"),
    confirmPassword: formString(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  redirect("/");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/welcome");
}

export async function completeOnboarding(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const weekdaysRaw = formString(formData, "availableWeekdays");
  const availableWeekdays = weekdaysRaw
    ? weekdaysRaw
        .split(",")
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value))
    : [];

  const parsed = onboardingSchema.safeParse({
    nickname: formString(formData, "nickname"),
    baselineWeeklyFrequency: formString(formData, "baselineWeeklyFrequency"),
    experienceLevel: formString(formData, "experienceLevel"),
    primaryGoal: formString(formData, "primaryGoal"),
    availableWeekdays,
    conditionScore: formString(formData, "conditionScore"),
    hasPain: formString(formData, "hasPain") === "true",
    recommendationDetail: formString(formData, "recommendationDetail"),
    targetCount: formString(formData, "targetCount"),
    timezone: formString(formData, "timezone") || "Asia/Seoul",
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "로그인이 필요해요." };
  }

  const recommendation = recommendWeeklyTarget({
    baselineWeeklyFrequency: parsed.data.baselineWeeklyFrequency,
    experienceLevel: parsed.data.experienceLevel,
    availableWeekdays: parsed.data.availableWeekdays,
    conditionScore: parsed.data.conditionScore,
    hasPain: parsed.data.hasPain,
  });

  const weekStart = getWeekStartDate(parsed.data.timezone);

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existingProfileError) {
    return { ok: false, message: existingProfileError.message };
  }

  if (!existingProfile) {
    const { error: insertProfileError } = await supabase.from("profiles").insert({
      id: user.id,
      nickname: parsed.data.nickname,
      timezone: parsed.data.timezone,
      recommendation_detail: parsed.data.recommendationDetail,
      onboarding_completed: true,
    });

    if (insertProfileError) {
      if (insertProfileError.code === "23505") {
        return { ok: false, message: "이미 사용 중인 닉네임이에요." };
      }
      return { ok: false, message: insertProfileError.message };
    }

    const { error: insertPrefsError } = await supabase
      .from("user_preferences")
      .upsert(
        {
          user_id: user.id,
          experience_level: parsed.data.experienceLevel,
          primary_goal: parsed.data.primaryGoal,
          available_weekdays: parsed.data.availableWeekdays,
          baseline_weekly_frequency: parsed.data.baselineWeeklyFrequency,
        },
        { onConflict: "user_id" },
      );

    if (insertPrefsError) {
      return { ok: false, message: insertPrefsError.message };
    }
  } else {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        nickname: parsed.data.nickname,
        timezone: parsed.data.timezone,
        recommendation_detail: parsed.data.recommendationDetail,
        onboarding_completed: true,
      })
      .eq("id", user.id);

    if (profileError) {
      if (profileError.code === "23505") {
        return { ok: false, message: "이미 사용 중인 닉네임이에요." };
      }
      return { ok: false, message: profileError.message };
    }

    const { error: prefsError } = await supabase
      .from("user_preferences")
      .upsert(
        {
          user_id: user.id,
          experience_level: parsed.data.experienceLevel,
          primary_goal: parsed.data.primaryGoal,
          available_weekdays: parsed.data.availableWeekdays,
          baseline_weekly_frequency: parsed.data.baselineWeeklyFrequency,
        },
        { onConflict: "user_id" },
      );

    if (prefsError) {
      return { ok: false, message: prefsError.message };
    }
  }

  const { error: goalError } = await supabase.from("weekly_goals").upsert(
    {
      user_id: user.id,
      week_start: weekStart,
      target_count: parsed.data.targetCount,
      recommended_count: recommendation.recommendedCount,
      recommendation_reason: recommendation.reason,
      confirmed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,week_start" },
  );

  if (goalError) {
    return { ok: false, message: goalError.message };
  }

  const { error: metaError } = await supabase.auth.updateUser({
    data: { onboarding_completed: true },
  });

  if (metaError) {
    return { ok: false, message: metaError.message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function updateProfileSettings(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = profileUpdateSchema.safeParse({
    nickname: formString(formData, "nickname"),
    recommendationDetail: formString(formData, "recommendationDetail"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "로그인이 필요해요." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      nickname: parsed.data.nickname,
      recommendation_detail: parsed.data.recommendationDetail,
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "이미 사용 중인 닉네임이에요." };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath("/profile");
  return { ok: true, message: "프로필을 저장했어요." };
}

export async function deleteAccount(): Promise<ActionResult> {
  void ACCOUNT_DELETION_POLICY;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "로그인이 필요해요." };
  }

  try {
    const admin = createServiceRoleClient();
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      return { ok: false, message: error.message };
    }
  } catch {
    return {
      ok: false,
      message:
        "회원 탈퇴를 처리하지 못했어요. 서버 설정(SUPABASE_SERVICE_ROLE_KEY)을 확인해 주세요.",
    };
  }

  await supabase.auth.signOut();
  redirect("/welcome");
}
