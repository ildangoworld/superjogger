import { redirect } from "next/navigation";
import {
  hasAdminPermission,
  normalizePermissions,
} from "@/features/admin/permissions";
import type {
  AdminPermissionKey,
  AdminRole,
  AdminUser,
} from "@/features/admin/types";
import { createClient } from "@/lib/supabase/server";

export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
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
