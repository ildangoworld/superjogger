"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOutAdmin } from "@/features/admin/actions";
import { ADMIN_MENU_ITEMS, adminPageTitle } from "@/features/admin/menu";
import { filterAdminMenuItems } from "@/features/admin/permissions";
import type { AdminMenuItem, AdminUser } from "@/features/admin/types";
import { Wordmark } from "@/components/brand/wordmark";

type AdminShellProps = {
  admin: AdminUser;
  children: React.ReactNode;
};

function splitHref(href: string): { path: string; hash: string } {
  const [path = href, hash = ""] = href.split("#");
  return { path, hash: hash ? `#${hash}` : "" };
}

function isMenuActive(
  href: string,
  pathname: string,
  hash: string,
  options?: { exactPath?: boolean },
): boolean {
  const { path, hash: itemHash } = splitHref(href);
  if (path === "/admin") {
    return pathname === "/admin" || pathname === "/admin/";
  }
  if (options?.exactPath) {
    if (pathname !== path) {
      return false;
    }
    if (itemHash) {
      return hash === itemHash;
    }
    return true;
  }
  if (itemHash) {
    return pathname === path && hash === itemHash;
  }
  return pathname === path || pathname.startsWith(`${path}/`);
}

function MenuLink({
  item,
  pathname,
  hash,
  desktopCollapsed,
  indented,
  onNavigate,
}: {
  item: AdminMenuItem;
  pathname: string;
  hash: string;
  desktopCollapsed: boolean;
  indented: boolean;
  onNavigate: () => void;
}) {
  const active = isMenuActive(item.href, pathname, hash, {
    exactPath: indented,
  });

  return (
    <Link
      href={item.href}
      title={item.label}
      onClick={onNavigate}
      className={[
        "rounded-lg py-2.5 text-sm font-medium transition-colors",
        indented ? "px-3 pl-6" : "px-3",
        active
          ? "bg-pine-800 text-fog-50"
          : "text-pine-900 hover:bg-fog-200",
        desktopCollapsed ? "lg:px-2 lg:text-center lg:pl-2" : "",
      ].join(" ")}
    >
      <span className={desktopCollapsed ? "lg:hidden" : ""}>{item.label}</span>
      <span className={desktopCollapsed ? "hidden lg:inline" : "hidden"}>
        {item.label.slice(0, 1)}
      </span>
    </Link>
  );
}

export function AdminShell({ admin, children }: AdminShellProps) {
  const pathname = usePathname();
  const [hash, setHash] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  const items = filterAdminMenuItems(admin, ADMIN_MENU_ITEMS);
  const title = adminPageTitle(pathname);

  return (
    <div className="bg-fog-50 text-foreground flex min-h-dvh">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="메뉴 닫기"
          className="fixed inset-0 z-40 bg-fog-950/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={[
          "border-line bg-fog-100 fixed inset-y-0 left-0 z-50 flex flex-col border-r transition-[width,transform] duration-300 ease-[var(--ease-calm)]",
          desktopCollapsed ? "lg:w-16" : "lg:w-60",
          "w-60",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div className="border-line flex h-14 items-center justify-between gap-2 border-b px-3">
          {!desktopCollapsed ? (
            <Wordmark className="text-base" />
          ) : (
            <span className="font-brand text-pine-900 text-sm font-semibold">
              SJ
            </span>
          )}
          <button
            type="button"
            className="text-muted hover:text-pine-800 hidden rounded-md p-2 text-sm lg:inline-flex"
            aria-label={desktopCollapsed ? "메뉴 펼치기" : "메뉴 접기"}
            onClick={() => setDesktopCollapsed((value) => !value)}
          >
            {desktopCollapsed ? "»" : "«"}
          </button>
          <button
            type="button"
            className="text-muted hover:text-pine-800 inline-flex rounded-md p-2 text-sm lg:hidden"
            aria-label="메뉴 닫기"
            onClick={() => setMobileOpen(false)}
          >
            ✕
          </button>
        </div>

        <nav
          aria-label="관리자 메뉴"
          className="flex flex-1 flex-col gap-1 overflow-y-auto p-2"
        >
          {items.map((item) => (
            <div key={item.key} className="flex flex-col gap-0.5">
              <MenuLink
                item={item}
                pathname={pathname}
                hash={hash}
                desktopCollapsed={desktopCollapsed}
                indented={false}
                onNavigate={() => setMobileOpen(false)}
              />
              {!desktopCollapsed && item.children
                ? item.children.map((child) => (
                    <MenuLink
                      key={child.key}
                      item={child}
                      pathname={pathname}
                      hash={hash}
                      desktopCollapsed={desktopCollapsed}
                      indented
                      onNavigate={() => setMobileOpen(false)}
                    />
                  ))
                : null}
            </div>
          ))}
        </nav>

        <div className="border-line border-t p-3">
          {!desktopCollapsed ? (
            <p className="text-muted mb-2 truncate text-xs">
              {admin.loginId ?? admin.email ?? admin.userId}
              <span className="ml-1">· {admin.role}</span>
            </p>
          ) : null}
          <form action={signOutAdmin}>
            <button
              type="submit"
              className="border-line text-pine-800 hover:bg-fog-200 w-full rounded-lg border px-3 py-2 text-sm font-medium"
            >
              로그아웃
            </button>
          </form>
        </div>
      </aside>

      <div
        className={[
          "flex min-w-0 flex-1 flex-col",
          desktopCollapsed ? "lg:pl-16" : "lg:pl-60",
        ].join(" ")}
      >
        <header className="border-line bg-fog-50/90 sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-4 backdrop-blur">
          <button
            type="button"
            className="border-line text-pine-800 hover:bg-fog-100 inline-flex rounded-lg border px-3 py-1.5 text-sm lg:hidden"
            aria-label="메뉴 열기"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
          >
            메뉴
          </button>
          <div className="min-w-0">
            <p className="text-muted text-xs">관리자</p>
            <h1 className="text-pine-900 truncate text-base font-semibold">
              {title}
            </h1>
          </div>
        </header>
        <main id="main-content" className="flex-1 px-4 py-6 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
