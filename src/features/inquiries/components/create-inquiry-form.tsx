"use client";

import { useActionState } from "react";
import { createInquiry } from "@/features/inquiries/actions";
import type { ActionResult } from "@/features/auth/actions";
import { AuthMessage } from "@/features/auth/components/auth-message";

const initial: ActionResult = { ok: false };

export function CreateInquiryForm() {
  const [state, action, pending] = useActionState(createInquiry, initial);

  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-pine-900 font-medium">제목</span>
        <input
          name="title"
          required
          maxLength={100}
          className="border-line bg-fog-50 focus:border-pine-500 h-11 rounded-lg border px-3 outline-none"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-pine-900 font-medium">내용</span>
        <textarea
          name="content"
          required
          rows={5}
          maxLength={5000}
          className="border-line bg-fog-50 focus:border-pine-500 rounded-lg border px-3 py-2 outline-none"
        />
      </label>
      <AuthMessage result={state.ok || state.message ? state : null} />
      <button
        type="submit"
        disabled={pending}
        className="bg-pine-800 text-fog-50 hover:bg-pine-700 h-11 rounded-lg text-sm font-semibold disabled:opacity-60"
      >
        {pending ? "등록 중" : "문의 등록"}
      </button>
    </form>
  );
}
