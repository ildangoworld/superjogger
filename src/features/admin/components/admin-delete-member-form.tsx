"use client";

import { useActionState } from "react";
import { deleteAdminMember } from "@/features/admin/actions";
import type { ActionResult } from "@/features/auth/actions";
import { AuthMessage } from "@/features/auth/components/auth-message";

const initial: ActionResult = { ok: false };

type Props = {
  userId: string;
  nickname: string;
};

export function AdminDeleteMemberForm({ userId, nickname }: Props) {
  const [state, action, pending] = useActionState(deleteAdminMember, initial);

  return (
    <form
      action={action}
      className="border-dawn-300 bg-dawn-50 flex max-w-md flex-col gap-3 rounded-lg border p-4"
    >
      <input type="hidden" name="userId" value={userId} />
      <p className="text-dawn-900 text-sm leading-relaxed">
        회원 탈퇴는 되돌릴 수 없어요. 확인을 위해 닉네임{" "}
        <span className="font-semibold">{nickname}</span> 을(를) 입력해
        주세요.
      </p>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-pine-900 font-medium">닉네임 확인</span>
        <input
          name="confirmNickname"
          required
          autoComplete="off"
          className="border-line bg-fog-50 focus:border-pine-500 h-11 rounded-lg border px-3 outline-none"
        />
      </label>
      <AuthMessage result={state.ok || state.message ? state : null} />
      <button
        type="submit"
        disabled={pending}
        className="bg-dawn-700 text-fog-50 hover:bg-dawn-600 h-11 rounded-lg text-sm font-semibold disabled:opacity-60"
      >
        {pending ? "처리 중" : "회원 탈퇴 처리"}
      </button>
    </form>
  );
}
