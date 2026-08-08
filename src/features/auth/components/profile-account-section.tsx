"use client";

import { useState, useTransition } from "react";
import {
  deleteAccount,
  signOut,
  type ActionResult,
} from "@/features/auth/actions";
import { AuthMessage } from "@/features/auth/components/auth-message";

export function ProfileAccountSection() {
  const [signingOut, startSignOut] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [deleteState, setDeleteState] = useState<ActionResult | null>(null);

  return (
    <section className="flex flex-col gap-3">
      <button
        type="button"
        disabled={signingOut}
        onClick={() => startSignOut(() => signOut())}
        className="border-line text-pine-800 h-12 rounded-lg border font-medium"
      >
        {signingOut ? "로그아웃 중" : "로그아웃"}
      </button>
      <button
        type="button"
        disabled={deleting}
        onClick={() => {
          const confirmed = window.confirm(
            "회원 탈퇴는 되돌릴 수 없어요. 프로필과 운동 관련 데이터가 모두 삭제됩니다. 계속할까요?",
          );
          if (!confirmed) {
            return;
          }
          startDelete(async () => {
            const result = await deleteAccount();
            if (result?.message) {
              setDeleteState(result);
            }
          });
        }}
        className="text-dawn-900 h-12 rounded-lg font-medium underline-offset-4 hover:underline"
      >
        {deleting ? "탈퇴 처리 중" : "회원 탈퇴"}
      </button>
      <AuthMessage result={deleteState} />
    </section>
  );
}
