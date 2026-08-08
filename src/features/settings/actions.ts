"use server";

import { revalidatePath } from "next/cache";
import {
  withAdminPermission,
  writeAdminAuditLog,
} from "@/features/admin/admin-db";
import { requireSuperAdmin } from "@/features/admin/auth";
import type { ActionResult } from "@/features/auth/actions";
import {
  countSuperAdmins,
  findAuthUserIdByEmail,
} from "@/features/settings/admins";
import { normalizeAiAppSettings } from "@/features/settings/resolve";
import { saveAiAppSettings } from "@/features/settings/queries";
import {
  addAdminUserSchema,
  removeAdminUserSchema,
  updateAdminUserSchema,
  updateAiSettingsSchema,
} from "@/features/settings/schemas";
import { createServiceRoleClient } from "@/lib/supabase/server";

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function formPermissions(formData: FormData): string[] {
  return formData
    .getAll("permissions")
    .filter((value): value is string => typeof value === "string");
}

export async function updateAiSettings(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { admin, db } = await withAdminPermission("settings");
  const parsed = updateAiSettingsSchema.safeParse({
    aiModel: formString(formData, "aiModel"),
    aiDailyLimit: formString(formData, "aiDailyLimit"),
    aiBaseUrl: formString(formData, "aiBaseUrl"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.",
    };
  }

  const settings = normalizeAiAppSettings(parsed.data);

  try {
    await saveAiAppSettings({
      settings,
      updatedBy: admin.userId,
    });
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "설정을 저장하지 못했어요.",
    };
  }

  await writeAdminAuditLog(db, {
    actorId: admin.userId,
    action: "AI_SETTINGS_UPDATE",
    targetType: "app_settings",
    detail: {
      aiModel: settings.aiModel,
      aiDailyLimit: settings.aiDailyLimit,
      aiBaseUrl: settings.aiBaseUrl,
    },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/ai");
  revalidatePath("/admin");
  return { ok: true, message: "AI 설정을 저장했어요." };
}

export async function addAdminUser(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  const db = createServiceRoleClient();
  const parsed = addAdminUserSchema.safeParse({
    email: formString(formData, "email"),
    role: formString(formData, "role"),
    permissions: formPermissions(formData),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.",
    };
  }

  const userId = await findAuthUserIdByEmail(db, parsed.data.email);
  if (!userId) {
    return {
      ok: false,
      message: "해당 이메일의 회원을 찾을 수 없어요.",
    };
  }

  const { data: existing } = await db
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    return { ok: false, message: "이미 관리자로 등록된 계정이에요." };
  }

  const permissions =
    parsed.data.role === "SUPER" ? [] : parsed.data.permissions;

  const { error } = await db.from("admin_users").insert({
    user_id: userId,
    role: parsed.data.role,
    permissions,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  await writeAdminAuditLog(db, {
    actorId: admin.userId,
    action: "ADMIN_USER_ADD",
    targetType: "admin_user",
    targetId: userId,
    detail: {
      email: parsed.data.email,
      role: parsed.data.role,
      permissions,
    },
  });

  revalidatePath("/admin/settings/admins");
  return { ok: true, message: "관리자를 추가했어요." };
}

export async function updateAdminUser(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  const db = createServiceRoleClient();
  const parsed = updateAdminUserSchema.safeParse({
    userId: formString(formData, "userId"),
    role: formString(formData, "role"),
    permissions: formPermissions(formData),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.",
    };
  }

  const { data: target, error: targetError } = await db
    .from("admin_users")
    .select("user_id, role")
    .eq("user_id", parsed.data.userId)
    .maybeSingle();

  if (targetError) {
    return { ok: false, message: targetError.message };
  }
  if (!target) {
    return { ok: false, message: "관리자를 찾을 수 없어요." };
  }

  if (
    target.role === "SUPER" &&
    parsed.data.role !== "SUPER" &&
    (await countSuperAdmins(db)) <= 1
  ) {
    return {
      ok: false,
      message: "마지막 SUPER 관리자의 역할은 변경할 수 없어요.",
    };
  }

  const permissions =
    parsed.data.role === "SUPER" ? [] : parsed.data.permissions;

  const { error } = await db
    .from("admin_users")
    .update({
      role: parsed.data.role,
      permissions,
    })
    .eq("user_id", parsed.data.userId);

  if (error) {
    return { ok: false, message: error.message };
  }

  await writeAdminAuditLog(db, {
    actorId: admin.userId,
    action: "ADMIN_USER_UPDATE",
    targetType: "admin_user",
    targetId: parsed.data.userId,
    detail: { role: parsed.data.role, permissions },
  });

  revalidatePath("/admin/settings/admins");
  return { ok: true, message: "관리자 권한을 변경했어요." };
}

export async function removeAdminUser(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  const db = createServiceRoleClient();
  const parsed = removeAdminUserSchema.safeParse({
    userId: formString(formData, "userId"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.",
    };
  }

  if (parsed.data.userId === admin.userId) {
    return { ok: false, message: "본인 관리자 권한은 해제할 수 없어요." };
  }

  const { data: target, error: targetError } = await db
    .from("admin_users")
    .select("user_id, role")
    .eq("user_id", parsed.data.userId)
    .maybeSingle();

  if (targetError) {
    return { ok: false, message: targetError.message };
  }
  if (!target) {
    return { ok: false, message: "관리자를 찾을 수 없어요." };
  }

  if (target.role === "SUPER" && (await countSuperAdmins(db)) <= 1) {
    return {
      ok: false,
      message: "마지막 SUPER 관리자는 해제할 수 없어요.",
    };
  }

  const { error } = await db
    .from("admin_users")
    .delete()
    .eq("user_id", parsed.data.userId);

  if (error) {
    return { ok: false, message: error.message };
  }

  await writeAdminAuditLog(db, {
    actorId: admin.userId,
    action: "ADMIN_USER_REMOVE",
    targetType: "admin_user",
    targetId: parsed.data.userId,
    detail: { role: target.role },
  });

  revalidatePath("/admin/settings/admins");
  return { ok: true, message: "관리자 권한을 해제했어요." };
}
