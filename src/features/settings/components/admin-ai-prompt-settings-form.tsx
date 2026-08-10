"use client";

import { useActionState } from "react";
import { DETAIL_RULE_PLACEHOLDER } from "@/features/analysis/prompts";
import type { ActionResult } from "@/features/auth/actions";
import { AuthMessage } from "@/features/auth/components/auth-message";
import { updateAiPromptSettings } from "@/features/settings/actions";
import type { AiPromptSettings } from "@/features/settings/types";

const initial: ActionResult = { ok: false };

export function AdminAiPromptSettingsForm({
  settings,
}: {
  settings: AiPromptSettings;
}) {
  const [state, action, pending] = useActionState(
    updateAiPromptSettings,
    initial,
  );

  return (
    <form action={action} className="flex max-w-3xl flex-col gap-4">
      <p className="text-muted text-sm leading-6">
        운동 분석 요청에 사용하는 프롬프트예요. 시스템 프롬프트에{" "}
        <code className="text-pine-800">{DETAIL_RULE_PLACEHOLDER}</code>를
        넣으면 회원 추천 상세도에 맞는 규칙으로 치환돼요. 비어 있으면 기본
        프롬프트가 사용돼요.
      </p>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-pine-900 font-medium">시스템 프롬프트</span>
        <textarea
          name="systemPrompt"
          required
          rows={12}
          maxLength={10000}
          defaultValue={settings.systemPrompt}
          className="border-line bg-fog-50 focus:border-pine-500 rounded-lg border px-3 py-2 font-mono text-xs leading-5 outline-none"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-pine-900 font-medium">
          상세 추천 규칙 (DETAILED)
        </span>
        <textarea
          name="detailRuleDetailed"
          required
          rows={3}
          maxLength={2000}
          defaultValue={settings.detailRuleDetailed}
          className="border-line bg-fog-50 focus:border-pine-500 rounded-lg border px-3 py-2 font-mono text-xs leading-5 outline-none"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-pine-900 font-medium">
          간단 추천 규칙 (LIGHT)
        </span>
        <textarea
          name="detailRuleLight"
          required
          rows={3}
          maxLength={2000}
          defaultValue={settings.detailRuleLight}
          className="border-line bg-fog-50 focus:border-pine-500 rounded-lg border px-3 py-2 font-mono text-xs leading-5 outline-none"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-pine-900 font-medium">사용자 지시문</span>
        <textarea
          name="userInstruction"
          required
          rows={3}
          maxLength={2000}
          defaultValue={settings.userInstruction}
          className="border-line bg-fog-50 focus:border-pine-500 rounded-lg border px-3 py-2 font-mono text-xs leading-5 outline-none"
        />
      </label>
      <AuthMessage result={state.ok || state.message ? state : null} />
      <button
        type="submit"
        disabled={pending}
        className="bg-pine-800 text-fog-50 hover:bg-pine-700 h-11 w-fit rounded-lg px-4 text-sm font-semibold disabled:opacity-60"
      >
        {pending ? "저장 중" : "프롬프트 저장"}
      </button>
    </form>
  );
}
