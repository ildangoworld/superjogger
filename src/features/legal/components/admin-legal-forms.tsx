"use client";

import { useActionState } from "react";
import {
  createLegalDraft,
  publishLegalDraft,
  updateLegalDraft,
} from "@/features/legal/admin-actions";
import type { ActionResult } from "@/features/auth/actions";
import { AuthMessage } from "@/features/auth/components/auth-message";
import { LEGAL_DOC_LABELS } from "@/features/legal/constants";
import type { LegalDocType, LegalDocument } from "@/features/legal/types";

const initial: ActionResult = { ok: false };

export function AdminCreateLegalDraftForm({
  docType,
  defaultContent,
}: {
  docType: LegalDocType;
  defaultContent: string;
}) {
  const [state, action, pending] = useActionState(createLegalDraft, initial);

  return (
    <form action={action} className="flex max-w-3xl flex-col gap-3">
      <input type="hidden" name="docType" value={docType} />
      <p className="text-muted text-sm">
        {LEGAL_DOC_LABELS[docType]}의 새 버전 초안을 만듭니다. 게시 전에는
        수정할 수 있어요.
      </p>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-pine-900 font-medium">본문 (마크다운)</span>
        <textarea
          name="content"
          required
          rows={16}
          defaultValue={defaultContent}
          className="border-line bg-fog-50 focus:border-pine-500 rounded-lg border px-3 py-2 font-mono text-sm outline-none"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-pine-900 font-medium">개정 사유 (선택)</span>
        <input
          name="changeSummary"
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
        {pending ? "만드는 중" : "초안 만들기"}
      </button>
    </form>
  );
}

export function AdminUpdateLegalDraftForm({
  document,
}: {
  document: LegalDocument;
}) {
  const [state, action, pending] = useActionState(updateLegalDraft, initial);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={document.id} />
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-pine-900 font-medium">본문 (마크다운)</span>
        <textarea
          name="content"
          required
          rows={18}
          defaultValue={document.content}
          className="border-line bg-fog-50 focus:border-pine-500 rounded-lg border px-3 py-2 font-mono text-sm outline-none"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-pine-900 font-medium">개정 사유</span>
        <input
          name="changeSummary"
          maxLength={500}
          defaultValue={document.changeSummary ?? ""}
          className="border-line bg-fog-50 focus:border-pine-500 h-11 rounded-lg border px-3 outline-none"
        />
      </label>
      <AuthMessage result={state.ok || state.message ? state : null} />
      <button
        type="submit"
        disabled={pending}
        className="bg-pine-800 text-fog-50 hover:bg-pine-700 h-11 w-fit rounded-lg px-4 text-sm font-semibold disabled:opacity-60"
      >
        {pending ? "저장 중" : "초안 저장"}
      </button>
    </form>
  );
}

export function AdminPublishLegalDraftForm({
  document,
}: {
  document: LegalDocument;
}) {
  const [state, action, pending] = useActionState(publishLegalDraft, initial);

  return (
    <form
      action={action}
      className="border-line flex max-w-md flex-col gap-3 rounded-lg border p-4"
    >
      <input type="hidden" name="id" value={document.id} />
      <h3 className="text-pine-900 text-sm font-semibold">게시 (예약)</h3>
      <p className="text-muted text-xs leading-5">
        게시 후에는 수정할 수 없어요. 시행일이 오늘 이전이면 즉시 적용되고,
        미래면 예약 게시됩니다.
      </p>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-pine-900 font-medium">시행일</span>
        <input
          name="effectiveDate"
          type="date"
          required
          className="border-line bg-fog-50 focus:border-pine-500 h-11 rounded-lg border px-3 outline-none"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-pine-900 font-medium">개정 사유</span>
        <input
          name="changeSummary"
          required
          maxLength={500}
          defaultValue={document.changeSummary ?? ""}
          className="border-line bg-fog-50 focus:border-pine-500 h-11 rounded-lg border px-3 outline-none"
        />
      </label>
      <AuthMessage result={state.ok || state.message ? state : null} />
      <button
        type="submit"
        disabled={pending}
        className="bg-dawn-700 text-fog-50 hover:bg-dawn-600 h-11 rounded-lg text-sm font-semibold disabled:opacity-60"
      >
        {pending ? "게시 중" : "게시하기"}
      </button>
    </form>
  );
}
