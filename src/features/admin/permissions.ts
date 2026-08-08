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

export function filterAdminMenuItems<T extends AdminMenuItemLike>(
  admin: Pick<AdminUser, "role" | "permissions">,
  items: T[],
): T[] {
  return items.flatMap((item) => {
    if (item.requiresSuper && admin.role !== "SUPER") {
      return [];
    }

    const children = item.children
      ? filterAdminMenuItems(admin, item.children)
      : undefined;

    const allowedByPermission =
      item.permission === null || hasAdminPermission(admin, item.permission);
    const hasVisibleChildren = Boolean(children && children.length > 0);

    if (!allowedByPermission && !hasVisibleChildren) {
      return [];
    }

    return [
      {
        ...item,
        ...(children ? { children } : {}),
      },
    ];
  });
}

type AdminMenuItemLike = {
  permission: AdminPermissionKey | null;
  requiresSuper?: boolean;
  children?: AdminMenuItemLike[];
};
