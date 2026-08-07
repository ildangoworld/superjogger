"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  requestPasswordReset,
  type ActionResult,
} from "@/features/auth/actions";
import { AuthMessage } from "@/features/auth/components/auth-message";

const initial: ActionResult = { ok: false };

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(
    requestPasswordReset,
    initial,
  );

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-pine-900 font-medium">이메일</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="border-line bg-fog-50 focus:border-pine-500 h-12 rounded-lg border px-3 outline-none"
          />
        </label>
        <AuthMessage result={state.ok || state.message ? state : null} />
        <button
          type="submit"
          disabled={pending}
          className="bg-pine-800 text-fog-50 hover:bg-pine-700 h-12 rounded-lg text-base font-semibold transition-colors disabled:opacity-60"
        >
          {pending ? "보내는 중…" : "재설정 링크 보내기"}
        </button>
      </form>
      <Link href="/login" className="text-pine-700 text-sm underline-offset-4 hover:underline">
        로그인으로 돌아가기
      </Link>
    </div>
  );
}
