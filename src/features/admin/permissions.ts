import type {
  AdminPermissionKey,
  AdminRole,
  AdminUser,
} from "@/features/admin/types";

export const ADMIN_PERMISSION_KEYS: readonly AdminPermissionKey[] = [
  "dashboard",
  "members",
  "crews",
  "inquiries",
  "legal",
  "settings",
] as const;

export function isAdminPermissionKey(
  value: string,
): value is AdminPermissionKey {
  return (ADMIN_PERMISSION_KEYS as readonly string[]).includes(value);
}

export function normalizePermissions(
  permissions: string[] | null | undefined,
): AdminPermissionKey[] {
  if (!permissions) {
    return [];
  }
  return permissions.filter(isAdminPermissionKey);
}

export function hasAdminPermission(
  admin: Pick<AdminUser, "role" | "permissions">,
  permission: AdminPermissionKey,
): boolean {
  if (admin.role === "SUPER") {
    return true;
  }
  return admin.permissions.includes(permission);
}

export function isSuperAdmin(role: AdminRole): boolean {
  return role === "SUPER";
}

export function filterAdminMenuItems<
  T extends { permission: AdminPermissionKey | null },
>(admin: Pick<AdminUser, "role" | "permissions">, items: T[]): T[] {
  return items.filter((item) => {
    if (item.permission === null) {
      return true;
    }
    return hasAdminPermission(admin, item.permission);
  });
}
