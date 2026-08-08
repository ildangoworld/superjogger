import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import { recordUserConsents } from "@/features/legal/queries";
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
} from "@/lib/supabase/env";
import { createServiceRoleClient } from "@/lib/supabase/server";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

function resolveRedirectOrigin(request: NextRequest): string {
  const origin = new URL(request.url).origin;
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";

  if (process.env.NODE_ENV !== "development" && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return origin;
}

function parsePositiveInt(value: string | null): number | null {
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return null;
  }
  return parsed;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/onboarding";
  const next = rawNext.startsWith("/") ? rawNext : "/onboarding";
  const termsVersion = parsePositiveInt(searchParams.get("termsVersion"));
  const privacyVersion = parsePositiveInt(searchParams.get("privacyVersion"));
  const origin = resolveRedirectOrigin(request);

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback`);
  }

  const cookiesToSet: CookieToSet[] = [];

  const supabase = createServerClient<Database>(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach((cookie) => {
            cookiesToSet.push(cookie);
          });
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  let destination = `${origin}${next}`;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const metaTerms = parsePositiveInt(
      user.user_metadata?.consent_terms_version != null
        ? String(user.user_metadata.consent_terms_version)
        : null,
    );
    const metaPrivacy = parsePositiveInt(
      user.user_metadata?.consent_privacy_version != null
        ? String(user.user_metadata.consent_privacy_version)
        : null,
    );
    const resolvedTerms = termsVersion ?? metaTerms;
    const resolvedPrivacy = privacyVersion ?? metaPrivacy;

    if (resolvedTerms && resolvedPrivacy) {
      try {
        await recordUserConsents({
          userId: user.id,
          termsVersion: resolvedTerms,
          privacyVersion: resolvedPrivacy,
          client: createServiceRoleClient(),
        });
      } catch {
        // Consent may already exist; do not block auth completion.
      }
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.onboarding_completed) {
      await supabase.auth.updateUser({
        data: { onboarding_completed: true },
      });
      destination = `${origin}/`;
    }
  }

  const response = NextResponse.redirect(destination);
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
  return response;
}
