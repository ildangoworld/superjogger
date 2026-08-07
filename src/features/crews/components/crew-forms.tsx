"use client";

import { useActionState } from "react";
import {
  createCrew,
  joinCrew,
  type CrewActionResult,
} from "@/features/crews/actions";

const initial: CrewActionResult = { ok: false };

export function CreateCrewForm() {
  const [state, action, pending] = useActionState(createCrew, initial);

  return (
    <form action={action} className="flex flex-col gap-3">
      <h2 className="text-pine-900 text-lg font-semibold">크루 만들기</h2>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-pine-800 font-medium">크루 이름</span>
        <input
          name="name"
          required
          maxLength={40}
          className="border-line focus:border-pine-500 h-11 rounded-lg border bg-white px-3 outline-none"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-pine-800 font-medium">소개 (선택)</span>
        <textarea
          name="description"
          maxLength={200}
          rows={2}
          className="border-line focus:border-pine-500 rounded-lg border bg-white px-3 py-2 outline-none"
        />
      </label>
      {state.message && !state.ok ? (
        <p className="text-dawn-900 text-sm">{state.message}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="bg-pine-800 text-fog-50 hover:bg-pine-700 h-11 rounded-lg font-semibold disabled:opacity-60"
      >
        {pending ? "만드는 중" : "크루 만들기"}
      </button>
    </form>
  );
}

export function JoinCrewForm() {
  const [state, action, pending] = useActionState(joinCrew, initial);

  return (
    <form action={action} className="flex flex-col gap-3">
      <h2 className="text-pine-900 text-lg font-semibold">초대 코드로 가입</h2>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-pine-800 font-medium">초대 코드</span>
        <input
          name="inviteCode"
          required
          autoCapitalize="characters"
          className="border-line focus:border-pine-500 h-11 rounded-lg border bg-white px-3 tracking-wider uppercase outline-none"
        />
      </label>
      {state.message && !state.ok ? (
        <p className="text-dawn-900 text-sm">{state.message}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="border-line text-pine-800 h-11 rounded-lg border font-semibold disabled:opacity-60"
      >
        {pending ? "가입 중" : "크루 가입"}
      </button>
    </form>
  );
}
