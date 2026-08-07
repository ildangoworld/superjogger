"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/features/admin/auth";
import { ADMIN_MENU_ITEMS } from "@/features/admin/menu";
import {
  filterAdminMenuItems,
  normalizePermissions,
} from "@/features/admin/permissions";
import {
  adminChangePasswordSchema,
  adminLoginSchema,
} from "@/features/admin/schemas";
import type { AdminRole } from "@/features/admin/types";
import type { ActionResult } from "@/features/auth/actions";
import { createClient } from "@/lib/supabase/server";

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function signInAsAdmin(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = adminLoginSchema.safeParse({
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

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("user_id, role, permissions")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminRow) {
    await supabase.auth.signOut();
    return {
      ok: false,
      message: "관리자 권한이 없는 계정이에요.",
    };
  }

  const visible = filterAdminMenuItems(
    {
      role: adminRow.role as AdminRole,
      permissions: normalizePermissions(adminRow.permissions),
    },
    ADMIN_MENU_ITEMS,
  );
  redirect(visible[0]?.href ?? "/admin/settings/account");
}

export async function signOutAdmin(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function changeAdminPassword(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = adminChangePasswordSchema.safeParse({
    currentPassword: formString(formData, "currentPassword"),
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { ok: false, message: "로그인이 필요해요." };
  }

  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });

  if (reauthError) {
    return { ok: false, message: "현재 비밀번호가 올바르지 않아요." };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/settings/account");
  return { ok: true, message: "비밀번호를 변경했어요." };
}
