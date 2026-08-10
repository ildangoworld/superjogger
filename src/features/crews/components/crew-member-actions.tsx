"use client";

import { useActionState, useState } from "react";
import { Modal } from "@/components/layout/modal";
import {
  leaveCrew,
  removeCrewMember,
  type CrewActionResult,
} from "@/features/crews/actions";

const initial: CrewActionResult = { ok: false };

export function LeaveCrewButton({
  crewId,
  isOwner,
  memberCount,
}: {
  crewId: string;
  isOwner: boolean;
  memberCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(leaveCrew, initial);

  const warning = isOwner
    ? memberCount <= 1
      ? "당신이 유일한 멤버예요. 나가면 이 크루는 삭제되고 복구할 수 없어요."
      : "당신은 크루 리더예요. 나가면 가장 먼저 가입한 멤버에게 리더 권한이 넘어가요."
    : "크루에서 나가면 멤버 현황을 볼 수 없어요. 다시 들어오려면 가입 신청이 필요해요.";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-dawn-900 text-sm font-medium underline-offset-4 hover:underline"
      >
        크루 나가기
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="크루에서 나갈까요?">
        <div className="flex flex-col gap-4">
          <p className="text-muted text-sm leading-6">{warning}</p>
          {state.message && !state.ok ? (
            <p className="text-dawn-900 text-sm">{state.message}</p>
          ) : null}
          <div className="flex flex-col gap-2">
            <form action={action}>
              <input type="hidden" name="crewId" value={crewId} />
              <button
                type="submit"
                disabled={pending}
                className="bg-dawn-700 text-fog-50 hover:bg-dawn-800 h-11 w-full rounded-lg font-semibold disabled:opacity-60"
              >
                {pending ? "처리 중" : "네, 나갈게요"}
              </button>
            </form>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="border-line text-pine-800 h-11 rounded-lg border text-sm font-medium"
            >
              취소
            </button>
          </div>
        </div>
      </Modal>
    </>
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
          if (!window.confirm(`${nickname}님을 크루에서 내보낼까요?`)) {
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
