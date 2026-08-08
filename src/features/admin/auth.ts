import { redirect } from "next/navigation";
import {
  hasAdminPermission,
  normalizePermissions,
} from "@/features/admin/permissions";
import {
  readAdminGateFromCookies,
  verifyAdminGateValue,
} from "@/features/admin/gate-cookie";
import type {
  AdminPermissionKey,
  AdminRole,
  AdminUser,
} from "@/features/admin/types";
import { createClient } from "@/lib/supabase/server";

function loginIdFromUser(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): string | null {
  const fromMeta = user.user_metadata?.admin_login_id;
  if (typeof fromMeta === "string" && fromMeta.length > 0) {
    return fromMeta;
  }
  return null;
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const gateOk = await verifyAdminGateValue(
    await readAdminGateFromCookies(),
    user.id,
  );
  if (!gateOk) {
    return null;
  }

  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id, role, permissions")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    userId: data.user_id,
    email: user.email ?? null,
    loginId: loginIdFromUser(user),
    role: data.role as AdminRole,
    permissions: normalizePermissions(data.permissions),
  };
}

export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdminUser();
  if (!admin) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/admin/login");
    }
    const gateOk = await verifyAdminGateValue(
      await readAdminGateFromCookies(),
      user.id,
    );
    if (!gateOk) {
      redirect("/admin/login");
    }
    redirect("/admin/forbidden");
  }
  return admin;
}

export async function requireAdminPermission(
  permission: AdminPermissionKey,
): Promise<AdminUser> {
  const admin = await requireAdmin();
  if (!hasAdminPermission(admin, permission)) {
    redirect("/admin/forbidden");
  }
  return admin;
}

export async function requireSuperAdmin(): Promise<AdminUser> {
  const admin = await requireAdmin();
  if (admin.role !== "SUPER") {
    redirect("/admin/forbidden");
  }
  return admin;
}
