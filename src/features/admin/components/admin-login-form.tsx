"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInAsAdmin } from "@/features/admin/actions";
import type { ActionResult } from "@/features/auth/actions";
import { AuthMessage } from "@/features/auth/components/auth-message";

const initial: ActionResult = { ok: false };

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(signInAsAdmin, initial);

  return (
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
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-pine-900 font-medium">비밀번호</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
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
        {pending ? "로그인 중" : "관리자 로그인"}
      </button>
      <p className="text-muted text-sm">
        <Link
          href="/welcome"
          className="text-pine-700 underline-offset-4 hover:underline"
        >
          사용자 사이트로 돌아가기
        </Link>
      </p>
    </form>
  );
}
