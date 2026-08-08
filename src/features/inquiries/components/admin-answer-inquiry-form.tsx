"use client";

import { useActionState } from "react";
import { answerInquiry } from "@/features/inquiries/admin-actions";
import type { ActionResult } from "@/features/auth/actions";
import { AuthMessage } from "@/features/auth/components/auth-message";

const initial: ActionResult = { ok: false };

type Props = {
  inquiryId: string;
  defaultAnswer?: string | null;
};

export function AdminAnswerInquiryForm({
  inquiryId,
  defaultAnswer,
}: Props) {
  const [state, action, pending] = useActionState(answerInquiry, initial);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={inquiryId} />
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-pine-900 font-medium">답변</span>
        <textarea
          name="answerContent"
          required
          rows={8}
          maxLength={5000}
          defaultValue={defaultAnswer ?? ""}
          className="border-line bg-fog-50 focus:border-pine-500 rounded-lg border px-3 py-2 outline-none"
        />
      </label>
      <AuthMessage result={state.ok || state.message ? state : null} />
      <button
        type="submit"
        disabled={pending}
        className="bg-pine-800 text-fog-50 hover:bg-pine-700 h-11 w-fit rounded-lg px-4 text-sm font-semibold disabled:opacity-60"
      >
        {pending ? "저장 중" : defaultAnswer ? "답변 수정" : "답변 등록"}
      </button>
    </form>
  );
}
