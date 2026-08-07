"use client";

import { useActionState, useState, useTransition } from "react";
import {
  deleteAccount,
  signOut,
  updateProfileSettings,
  type ActionResult,
} from "@/features/auth/actions";
import { AuthMessage } from "@/features/auth/components/auth-message";
import type { RecommendationDetail } from "@/features/auth/types";

type Props = {
  nickname: string;
  recommendationDetail: RecommendationDetail;
  email: string | undefined;
};

const initial: ActionResult = { ok: false };

export function ProfileSettingsForm({
  nickname,
  recommendationDetail,
  email,
}: Props) {
  const [state, action, pending] = useActionState(
    updateProfileSettings,
    initial,
  );
  const [signingOut, startSignOut] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [deleteState, setDeleteState] = useState<ActionResult | null>(null);

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-pine-900 text-lg font-semibold">기본 정보</h2>
          {email ? (
            <p className="text-muted mt-1 text-sm">{email}</p>
          ) : null}
        </div>
        <form action={action} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-pine-900 font-medium">닉네임</span>
            <input
              name="nickname"
              defaultValue={nickname}
              required
              minLength={2}
              maxLength={20}
              className="border-line bg-fog-50 focus:border-pine-500 h-12 rounded-lg border px-3 outline-none"
            />
          </label>
          <fieldset className="flex flex-col gap-2">
            <legend className="text-pine-900 text-sm font-medium">
              AI 추천 상세도
            </legend>
            {(
              [
                ["LIGHT", "가볍게"],
                ["DETAILED", "구체적으로"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className="border-line has-checked:border-pine-500 has-checked:bg-pine-50 flex items-center gap-3 rounded-lg border px-3 py-3 text-sm"
              >
                <input
                  type="radio"
                  name="recommendationDetail"
                  value={value}
                  defaultChecked={recommendationDetail === value}
                />
                {label}
              </label>
            ))}
          </fieldset>
          <AuthMessage result={state.ok || state.message ? state : null} />
          <button
            type="submit"
            disabled={pending}
            className="bg-pine-800 text-fog-50 hover:bg-pine-700 h-12 rounded-lg font-semibold disabled:opacity-60"
          >
            {pending ? "저장 중" : "저장하기"}
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-pine-900 text-lg font-semibold">계정</h2>
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
    </div>
  );
}
