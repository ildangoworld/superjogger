"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  label?: string;
};

export function GoogleSignInButton({
  label = "Google로 계속하기",
}: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setError(null);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/onboarding`;

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
        disabled={pending}
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
