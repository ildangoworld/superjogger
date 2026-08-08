import type { AdminDb } from "@/features/admin/admin-db";
import {
  normalizePermissions,
} from "@/features/admin/permissions";
import type {
  AdminPermissionKey,
  AdminRole,
} from "@/features/admin/types";

export type ManagedAdminUser = {
  userId: string;
  email: string | null;
  role: AdminRole;
  permissions: AdminPermissionKey[];
  createdAt: string;
  updatedAt: string;
};

export async function listManagedAdmins(
  db: AdminDb,
): Promise<ManagedAdminUser[]> {
  const { data, error } = await db
    .from("admin_users")
    .select("user_id, role, permissions, created_at, updated_at")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  const result: ManagedAdminUser[] = [];

  for (const row of rows) {
    const { data: authUser, error: authError } = await db.auth.admin.getUserById(
      row.user_id,
    );
    if (authError) {
      throw new Error(authError.message);
    }
    result.push({
      userId: row.user_id,
      email: authUser.user.email ?? null,
      role: row.role as AdminRole,
      permissions: normalizePermissions(row.permissions),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  return result;
}

export async function countSuperAdmins(db: AdminDb): Promise<number> {
  const { count, error } = await db
    .from("admin_users")
    .select("user_id", { count: "exact", head: true })
    .eq("role", "SUPER");

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function findAuthUserIdByEmail(
  db: AdminDb,
  email: string,
): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  let page = 1;
  const perPage = 200;

  for (;;) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new Error(error.message);
    }
    const match = data.users.find(
      (user) => user.email?.toLowerCase() === normalized,
    );
    if (match) {
      return match.id;
    }
    if (data.users.length < perPage) {
      return null;
    }
    page += 1;
  }
}
