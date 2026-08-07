"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  withAdminPermission,
  writeAdminAuditLog,
} from "@/features/admin/admin-db";
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

export async function deleteAdminMember(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { admin, db } = await withAdminPermission("members");
  const userId = formString(formData, "userId");
  const confirmNickname = formString(formData, "confirmNickname").trim();

  if (!userId) {
    return { ok: false, message: "회원 정보가 없어요." };
  }

  if (userId === admin.userId) {
    return { ok: false, message: "본인 계정은 탈퇴 처리할 수 없어요." };
  }

  const { data: profile, error: profileError } = await db
    .from("profiles")
    .select("nickname")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    return { ok: false, message: profileError.message };
  }
  if (!profile) {
    return { ok: false, message: "회원을 찾을 수 없어요." };
  }
  if (confirmNickname !== profile.nickname) {
    return {
      ok: false,
      message: "닉네임이 일치하지 않아요. 탈퇴를 확인하려면 닉네임을 입력해 주세요.",
    };
  }

  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) {
    return { ok: false, message: error.message };
  }

  await writeAdminAuditLog(db, {
    actorId: admin.userId,
    action: "MEMBER_DELETE",
    targetType: "user",
    targetId: userId,
    detail: { nickname: profile.nickname },
  });

  revalidatePath("/admin/members");
  redirect("/admin/members");
}

export async function reissueCrewInviteCode(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { admin, db } = await withAdminPermission("crews");
  const crewId = formString(formData, "crewId");

  if (!crewId) {
    return { ok: false, message: "크루 정보가 없어요." };
  }

  const { data: code, error: codeError } = await db.rpc(
    "generate_crew_invite_code",
  );
  if (codeError || !code) {
    return {
      ok: false,
      message: codeError?.message ?? "초대 코드를 만들지 못했어요.",
    };
  }

  const { error } = await db
    .from("crews")
    .update({ invite_code: code })
    .eq("id", crewId);

  if (error) {
    return { ok: false, message: error.message };
  }

  await writeAdminAuditLog(db, {
    actorId: admin.userId,
    action: "CREW_INVITE_REISSUE",
    targetType: "crew",
    targetId: crewId,
    detail: { inviteCode: code },
  });

  revalidatePath(`/admin/crews/${crewId}`);
  return { ok: true, message: `초대 코드를 재발급했어요: ${code}` };
}

export async function deleteAdminCrew(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { admin, db } = await withAdminPermission("crews");
  const crewId = formString(formData, "crewId");
  const confirmName = formString(formData, "confirmName").trim();

  if (!crewId) {
    return { ok: false, message: "크루 정보가 없어요." };
  }

  const { data: crew, error: crewError } = await db
    .from("crews")
    .select("name")
    .eq("id", crewId)
    .maybeSingle();

  if (crewError) {
    return { ok: false, message: crewError.message };
  }
  if (!crew) {
    return { ok: false, message: "크루를 찾을 수 없어요." };
  }
  if (confirmName !== crew.name) {
    return {
      ok: false,
      message: "크루 이름이 일치하지 않아요. 삭제를 확인하려면 이름을 입력해 주세요.",
    };
  }

  const { error } = await db.from("crews").delete().eq("id", crewId);
  if (error) {
    return { ok: false, message: error.message };
  }

  await writeAdminAuditLog(db, {
    actorId: admin.userId,
    action: "CREW_DELETE",
    targetType: "crew",
    targetId: crewId,
    detail: { name: crew.name },
  });

  revalidatePath("/admin/crews");
  redirect("/admin/crews");
}
