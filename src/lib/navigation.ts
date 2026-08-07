export type AppNavItem = {
  href: string;
  label: string;
  icon: "home" | "list" | "plus" | "crew" | "profile";
};

export const APP_NAV_ITEMS: AppNavItem[] = [
  { href: "/", label: "홈", icon: "home" },
  { href: "/workouts", label: "기록", icon: "list" },
  { href: "/record", label: "기록하기", icon: "plus" },
  { href: "/crews", label: "크루", icon: "crew" },
  { href: "/profile", label: "프로필", icon: "profile" },
];
