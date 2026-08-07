"use client";

import { useActionState } from "react";
import {
  updatePassword,
  type ActionResult,
} from "@/features/auth/actions";
import { AuthMessage } from "@/features/auth/components/auth-message";

const initial: ActionResult = { ok: false };

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, initial);

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-pine-900 font-medium">새 비밀번호</span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="border-line bg-fog-50 focus:border-pine-500 h-12 rounded-lg border px-3 outline-none"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-pine-900 font-medium">새 비밀번호 확인</span>
        <input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="border-line bg-fog-50 focus:border-pine-500 h-12 rounded-lg border px-3 outline-none"
        />
      </label>
      <AuthMessage result={state.ok || state.message ? state : null} />
      <button
        type="submit"
        disabled={pending}
        className="bg-pine-800 text-fog-50 hover:bg-pine-700 h-12 rounded-lg text-base font-semibold transition-colors disabled:opacity-60"
      >
        {pending ? "저장 중…" : "비밀번호 변경"}
      </button>
    </form>
  );
}
