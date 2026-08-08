"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  label?: string;
  requireConsent?: boolean;
  consentAccepted?: boolean;
  termsVersion?: number;
  privacyVersion?: number;
};

export function GoogleSignInButton({
  label = "Google로 계속하기",
  requireConsent = false,
  consentAccepted = true,
  termsVersion,
  privacyVersion,
}: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (requireConsent && !consentAccepted) {
      setError("이용약관과 개인정보처리방침에 동의해 주세요.");
      return;
    }

    setPending(true);
    setError(null);

    const supabase = createClient();
    const params = new URLSearchParams({ next: "/onboarding" });
    if (
      requireConsent &&
      typeof termsVersion === "number" &&
      typeof privacyVersion === "number"
    ) {
      params.set("termsVersion", String(termsVersion));
      params.set("privacyVersion", String(privacyVersion));
    }
    const redirectTo = `${window.location.origin}/auth/callback?${params.toString()}`;

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending || (requireConsent && !consentAccepted)}
        className="border-line text-pine-800 hover:bg-fog-100 flex h-12 w-full items-center justify-center rounded-lg border text-base font-medium transition-colors disabled:opacity-60"
      >
        {pending ? "Google로 이동 중" : label}
      </button>
      {error ? (
        <p
          role="status"
          className="border-dawn-300 bg-dawn-50 text-dawn-900 rounded-lg border px-3 py-2 text-sm"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
