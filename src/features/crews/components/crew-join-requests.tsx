"use client";

import { useActionState } from "react";
import {
  approveJoinRequest,
  rejectJoinRequest,
  type CrewActionResult,
} from "@/features/crews/actions";
import type { CrewJoinRequest } from "@/features/crews/types";

const initial: CrewActionResult = { ok: false };

function DecideButton({
  requestId,
  decision,
  label,
}: {
  requestId: string;
  decision: "approve" | "reject";
  label: string;
}) {
  const action = decision === "approve" ? approveJoinRequest : rejectJoinRequest;
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="requestId" value={requestId} />
      <button
        type="submit"
        disabled={pending}
        className={
          decision === "approve"
            ? "bg-pine-800 text-fog-50 hover:bg-pine-700 h-9 rounded-lg px-3 text-xs font-semibold disabled:opacity-60"
            : "border-line text-pine-800 h-9 rounded-lg border px-3 text-xs font-medium disabled:opacity-60"
        }
      >
        {pending ? "처리 중" : label}
      </button>
      {state.message && !state.ok ? (
        <p className="text-dawn-900 mt-1 text-xs">{state.message}</p>
      ) : null}
    </form>
  );
}

export function CrewJoinRequestsPanel({
  requests,
}: {
  requests: CrewJoinRequest[];
}) {
  if (requests.length === 0) {
    return null;
  }

  return (
    <section className="border-line border-t pt-6">
      <h2 className="text-pine-900 text-base font-semibold">가입 신청</h2>
      <p className="text-muted mt-1 text-sm">대기 중인 신청을 확인하고 승인하세요.</p>
      <ul className="mt-4 flex flex-col gap-3">
        {requests.map((request) => (
          <li
            key={request.id}
            className="border-line rounded-lg border px-4 py-3"
          >
            <p className="text-pine-900 font-semibold">{request.nickname}</p>
            {request.message ? (
              <p className="text-muted mt-2 text-sm leading-6 whitespace-pre-wrap">
                {request.message}
              </p>
            ) : (
              <p className="text-muted mt-2 text-sm">소개 없음</p>
            )}
            <div className="mt-3 flex gap-2">
              <DecideButton
                requestId={request.id}
                decision="approve"
                label="승인"
              />
              <DecideButton
                requestId={request.id}
                decision="reject"
                label="거절"
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
