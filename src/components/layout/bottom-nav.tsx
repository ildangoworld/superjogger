"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAV_ITEMS, type AppNavItem } from "@/lib/navigation";

function NavIcon({ icon }: { icon: AppNavItem["icon"] }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (icon) {
    case "home":
      return (
        <svg {...common}>
          <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5Z" />
        </svg>
      );
    case "list":
      return (
        <svg {...common}>
          <path d="M8 6h12M8 12h12M8 18h12" />
          <path d="M4 6h.01M4 12h.01M4 18h.01" />
        </svg>
      );
    case "plus":
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "crew":
      return (
        <svg {...common}>
          <circle cx="9" cy="8.5" r="3" />
          <path d="M3.5 19.5c.7-3 3-4.5 5.5-4.5s4.8 1.5 5.5 4.5" />
          <circle cx="16.5" cy="9.5" r="2.4" />
          <path d="M16 15.2c2.2.2 4 1.6 4.5 4.3" />
        </svg>
      );
    case "profile":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c.9-3.5 3.7-5.3 7-5.3s6.1 1.8 7 5.3" />
        </svg>
      );
  }
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="주요 메뉴"
      className="border-line bg-fog-50/90 fixed inset-x-0 bottom-0 z-10 border-t backdrop-blur-sm"
    >
      <ul className="mx-auto flex w-full max-w-md items-stretch justify-between px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {APP_NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const isRecord = item.icon === "plus";
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 py-1.5 text-[0.6875rem] font-medium transition-colors duration-300 ${
                  isActive
                    ? "text-pine-800"
                    : "text-fog-500 hover:text-pine-600"
                }`}
              >
                <span
                  className={
                    isRecord
                      ? `-mt-4 mb-0.5 flex size-10 items-center justify-center rounded-xl transition-colors duration-300 ${
                          isActive
                            ? "bg-pine-700 text-fog-50"
                            : "bg-pine-800 text-fog-50 hover:bg-pine-700"
                        }`
                      : undefined
                  }
                >
                  <NavIcon icon={item.icon} />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
