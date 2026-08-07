"use client";

import { useActionState } from "react";
import {
  deleteAdminCrew,
  reissueCrewInviteCode,
} from "@/features/admin/actions";
import type { ActionResult } from "@/features/auth/actions";
import { AuthMessage } from "@/features/auth/components/auth-message";

const initial: ActionResult = { ok: false };

export function AdminReissueInviteForm({ crewId }: { crewId: string }) {
  const [state, action, pending] = useActionState(
    reissueCrewInviteCode,
    initial,
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="crewId" value={crewId} />
      <AuthMessage result={state.ok || state.message ? state : null} />
      <button
        type="submit"
        disabled={pending}
        className="border-line text-pine-800 hover:bg-fog-100 h-11 rounded-lg border px-4 text-sm font-medium disabled:opacity-60"
      >
        {pending ? "재발급 중" : "초대 코드 재발급"}
      </button>
    </form>
  );
}

export function AdminDeleteCrewForm({
  crewId,
  name,
}: {
  crewId: string;
  name: string;
}) {
  const [state, action, pending] = useActionState(deleteAdminCrew, initial);

  return (
    <form
      action={action}
      className="border-dawn-300 bg-dawn-50 flex max-w-md flex-col gap-3 rounded-lg border p-4"
    >
      <input type="hidden" name="crewId" value={crewId} />
      <p className="text-dawn-900 text-sm leading-relaxed">
        크루 삭제는 되돌릴 수 없어요. 확인을 위해 크루 이름{" "}
        <span className="font-semibold">{name}</span> 을(를) 입력해 주세요.
      </p>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-pine-900 font-medium">크루 이름 확인</span>
        <input
          name="confirmName"
          required
          autoComplete="off"
          className="border-line bg-fog-50 focus:border-pine-500 h-11 rounded-lg border px-3 outline-none"
        />
      </label>
      <AuthMessage result={state.ok || state.message ? state : null} />
      <button
        type="submit"
        disabled={pending}
        className="bg-dawn-700 text-fog-50 hover:bg-dawn-600 h-11 rounded-lg text-sm font-semibold disabled:opacity-60"
      >
        {pending ? "삭제 중" : "크루 삭제"}
      </button>
    </form>
  );
}
