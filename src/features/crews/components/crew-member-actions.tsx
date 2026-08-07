"use client";

import { useActionState } from "react";
import {
  leaveCrew,
  removeCrewMember,
  type CrewActionResult,
} from "@/features/crews/actions";

const initial: CrewActionResult = { ok: false };

export function LeaveCrewButton({ crewId }: { crewId: string }) {
  const [state, action, pending] = useActionState(leaveCrew, initial);

  return (
    <form action={action}>
      <input type="hidden" name="crewId" value={crewId} />
      <button
        type="submit"
        disabled={pending}
        className="text-dawn-900 text-sm font-medium underline-offset-4 hover:underline disabled:opacity-60"
      >
        {pending ? "처리 중" : "크루 나가기"}
      </button>
      {state.message && !state.ok ? (
        <p className="text-dawn-900 mt-1 text-xs">{state.message}</p>
      ) : null}
    </form>
  );
}

export function RemoveMemberButton({
  crewId,
  memberUserId,
  nickname,
}: {
  crewId: string;
  memberUserId: string;
  nickname: string;
}) {
  const [state, action, pending] = useActionState(removeCrewMember, initial);

  return (
    <form action={action}>
      <input type="hidden" name="crewId" value={crewId} />
      <input type="hidden" name="memberUserId" value={memberUserId} />
      <button
        type="submit"
        disabled={pending}
        onClick={(event) => {
          if (
            !window.confirm(
              `${nickname}님을 크루에서 내보낼까요?`,
            )
          ) {
            event.preventDefault();
          }
        }}
        className="text-muted hover:text-dawn-900 text-xs font-medium disabled:opacity-60"
      >
        {pending ? "처리 중" : "내보내기"}
      </button>
      {state.message && !state.ok ? (
        <p className="text-dawn-900 mt-1 text-xs">{state.message}</p>
      ) : null}
    </form>
  );
}
