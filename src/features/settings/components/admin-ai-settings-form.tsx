"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/features/auth/actions";
import { AuthMessage } from "@/features/auth/components/auth-message";
import { updateAiSettings } from "@/features/settings/actions";
import type { AiAppSettings } from "@/features/settings/types";

const initial: ActionResult = { ok: false };

export function AdminAiSettingsForm({
  settings,
  envModel,
  envBaseUrl,
}: {
  settings: AiAppSettings;
  envModel: string;
  envBaseUrl: string;
}) {
  const [state, action, pending] = useActionState(updateAiSettings, initial);

  return (
    <form action={action} className="flex max-w-xl flex-col gap-4">
      <p className="text-muted text-sm leading-6">
        비워 두면 환경변수 값을 사용해요. API 키는 환경변수에만 두며 화면에서
        조회·수정할 수 없어요.
      </p>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-pine-900 font-medium">모델명</span>
        <input
          name="aiModel"
          defaultValue={settings.aiModel}
          placeholder={envModel || "AI_MODEL"}
          maxLength={200}
          className="border-line bg-fog-50 focus:border-pine-500 h-11 rounded-lg border px-3 outline-none"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-pine-900 font-medium">일일 분석 한도</span>
        <input
          name="aiDailyLimit"
          type="number"
          min={1}
          max={50}
          required
          defaultValue={settings.aiDailyLimit}
          className="border-line bg-fog-50 focus:border-pine-500 h-11 rounded-lg border px-3 outline-none"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-pine-900 font-medium">Base URL</span>
        <input
          name="aiBaseUrl"
          defaultValue={settings.aiBaseUrl}
          placeholder={envBaseUrl || "https://api.openai.com/v1"}
          maxLength={500}
          className="border-line bg-fog-50 focus:border-pine-500 h-11 rounded-lg border px-3 outline-none"
        />
      </label>
      <AuthMessage result={state.ok || state.message ? state : null} />
      <button
        type="submit"
        disabled={pending}
        className="bg-pine-800 text-fog-50 hover:bg-pine-700 h-11 w-fit rounded-lg px-4 text-sm font-semibold disabled:opacity-60"
      >
        {pending ? "저장 중" : "설정 저장"}
      </button>
    </form>
  );
}
