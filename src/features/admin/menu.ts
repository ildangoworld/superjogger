import type { AdminMenuItem } from "@/features/admin/types";

export const ADMIN_MENU_ITEMS: AdminMenuItem[] = [
  {
    key: "dashboard",
    href: "/admin",
    label: "대시보드",
    permission: "dashboard",
  },
  {
    key: "members",
    href: "/admin/members",
    label: "회원 관리",
    permission: "members",
  },
  {
    key: "crews",
    href: "/admin/crews",
    label: "크루 관리",
    permission: "crews",
  },
  {
    key: "inquiries",
    href: "/admin/inquiries",
    label: "문의 관리",
    permission: "inquiries",
  },
  {
    key: "legal",
    href: "/admin/legal",
    label: "콘텐츠 관리",
    permission: "legal",
  },
  {
    key: "settings",
    href: "/admin/settings",
    label: "설정",
    permission: "settings",
  },
  {
    key: "account",
    href: "/admin/settings/account",
    label: "내 계정",
    permission: null,
  },
];

export function adminPageTitle(pathname: string): string {
  if (pathname === "/admin" || pathname === "/admin/") {
    return "대시보드";
  }
  if (pathname.startsWith("/admin/legal/")) {
    return "콘텐츠 관리";
  }
  if (pathname.startsWith("/admin/inquiries/")) {
    return "문의 관리";
  }
  if (pathname === "/admin/settings/ai") {
    return "AI 설정";
  }
  if (pathname === "/admin/settings/admins") {
    return "관리자 계정 관리";
  }
  if (pathname === "/admin/settings/account") {
    return "내 계정";
  }
  const exact = ADMIN_MENU_ITEMS.find((item) => item.href === pathname);
  if (exact) {
    return exact.label;
  }
  const nested = ADMIN_MENU_ITEMS.find(
    (item) => item.href !== "/admin" && pathname.startsWith(`${item.href}/`),
  );
  return nested?.label ?? "관리자";
}
