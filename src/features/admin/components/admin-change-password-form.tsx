"use client";

import { useActionState } from "react";
import { changeAdminPassword } from "@/features/admin/actions";
import type { ActionResult } from "@/features/auth/actions";
import { AuthMessage } from "@/features/auth/components/auth-message";

const initial: ActionResult = { ok: false };

export function AdminChangePasswordForm() {
  const [state, action, pending] = useActionState(changeAdminPassword, initial);

  return (
    <form action={action} className="flex max-w-md flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-pine-900 font-medium">현재 비밀번호</span>
        <input
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          className="border-line bg-fog-50 focus:border-pine-500 h-12 rounded-lg border px-3 outline-none"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-pine-900 font-medium">새 비밀번호</span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
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
          className="border-line bg-fog-50 focus:border-pine-500 h-12 rounded-lg border px-3 outline-none"
        />
      </label>
      <AuthMessage result={state.ok || state.message ? state : null} />
      <button
        type="submit"
        disabled={pending}
        className="bg-pine-800 text-fog-50 hover:bg-pine-700 h-12 rounded-lg text-base font-semibold transition-colors disabled:opacity-60"
      >
        {pending ? "변경 중" : "비밀번호 변경"}
      </button>
    </form>
  );
}
