import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminOnlyAuthUser } from "@/features/admin/credentials";
import { hasValidAdminGate } from "@/features/admin/gate-cookie";
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
} from "@/lib/supabase/env";

const PUBLIC_PREFIXES = [
  "/welcome",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth",
  "/terms",
  "/privacy",
  "/admin/login",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isLegalPublicPath(pathname: string): boolean {
  return (
    pathname === "/terms" ||
    pathname.startsWith("/terms/") ||
    pathname === "/privacy" ||
    pathname.startsWith("/privacy/")
  );
}

function isAuthEntryPath(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password"
  );
}

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

async function isAdminUser(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Admin-only Auth accounts share cookies with the member app; keep them for
  // /admin but never treat them as logged-in members on the user site.
  const user =
    authUser && isAdminOnlyAuthUser(authUser) && !isAdminPath(pathname)
      ? null
      : authUser;

  if (isAdminPath(pathname)) {
    if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
      if (
        authUser &&
        (await isAdminUser(supabase, authUser.id)) &&
        (await hasValidAdminGate(request, authUser.id))
      ) {
        const url = request.nextUrl.clone();
        url.pathname = "/admin";
        url.search = "";
        return NextResponse.redirect(url);
      }
      return supabaseResponse;
    }

    if (pathname === "/admin/forbidden") {
      if (
        !authUser ||
        !(await hasValidAdminGate(request, authUser.id))
      ) {
        const url = request.nextUrl.clone();
        url.pathname = "/admin/login";
        return NextResponse.redirect(url);
      }
      return supabaseResponse;
    }

    if (
      !authUser ||
      !(await hasValidAdminGate(request, authUser.id))
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    if (!(await isAdminUser(supabase, authUser.id))) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/forbidden";
      url.search = "";
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  }

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? "/welcome" : "/login";
    if (pathname !== "/") {
      url.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(url);
  }

  if (user) {
    const onboardingCompleted = Boolean(
      user.user_metadata?.onboarding_completed,
    );

    if (pathname === "/reset-password" || isLegalPublicPath(pathname)) {
      return supabaseResponse;
    }

    if (isAuthEntryPath(pathname) || pathname === "/welcome") {
      const url = request.nextUrl.clone();
      url.pathname = onboardingCompleted ? "/" : "/onboarding";
      return NextResponse.redirect(url);
    }

    if (!onboardingCompleted && pathname !== "/onboarding") {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    if (onboardingCompleted && pathname === "/onboarding") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
