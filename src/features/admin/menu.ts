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
    children: [
      {
        key: "legal-terms",
        href: "/admin/legal#terms",
        label: "이용약관",
        permission: "legal",
      },
      {
        key: "legal-privacy",
        href: "/admin/legal#privacy",
        label: "개인정보처리방침",
        permission: "legal",
      },
    ],
  },
  {
    key: "settings",
    href: "/admin/settings",
    label: "설정",
    permission: "settings",
    children: [
      {
        key: "settings-ai",
        href: "/admin/settings/ai",
        label: "AI 설정",
        permission: "settings",
      },
      {
        key: "settings-prompts",
        href: "/admin/settings/prompts",
        label: "AI 프롬프트",
        permission: "settings",
      },
      {
        key: "settings-admins",
        href: "/admin/settings/admins",
        label: "관리자 계정 관리",
        permission: "settings",
        requiresSuper: true,
      },
      {
        key: "settings-account",
        href: "/admin/settings/account",
        label: "내 계정",
        permission: null,
      },
    ],
  },
];

function menuItemTitle(item: AdminMenuItem, pathname: string): string | null {
  if (item.children) {
    for (const child of item.children) {
      const childPath = child.href.split("#")[0] ?? child.href;
      if (childPath === item.href) {
        continue;
      }
      if (
        pathname === childPath ||
        pathname.startsWith(`${childPath}/`)
      ) {
        return child.label;
      }
    }
  }
  if (item.href === "/admin") {
    return pathname === "/admin" || pathname === "/admin/"
      ? item.label
      : null;
  }
  if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
    return item.label;
  }
  return null;
}

export function adminPageTitle(pathname: string): string {
  for (const item of ADMIN_MENU_ITEMS) {
    const title = menuItemTitle(item, pathname);
    if (title) {
      return title;
    }
  }
  return "관리자";
}
