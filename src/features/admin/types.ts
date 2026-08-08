export type AdminPermissionKey =
  | "dashboard"
  | "members"
  | "crews"
  | "inquiries"
  | "legal"
  | "settings";

export type AdminRole = "SUPER" | "STAFF";

export type AdminUser = {
  userId: string;
  email: string | null;
  loginId: string | null;
  role: AdminRole;
  permissions: AdminPermissionKey[];
};

export type AdminMenuItem = {
  key: AdminPermissionKey | "account";
  href: string;
  label: string;
  permission: AdminPermissionKey | null;
};
