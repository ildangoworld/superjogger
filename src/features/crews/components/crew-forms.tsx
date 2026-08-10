"use client";

import { useActionState, useState } from "react";
import { Modal } from "@/components/layout/modal";
import {
  createCrew,
  requestJoinCrew,
  type CrewActionResult,
} from "@/features/crews/actions";

const initial: CrewActionResult = { ok: false };

export function CreateCrewForm() {
  const [state, action, pending] = useActionState(createCrew, initial);

  return (
    <form action={action} className="flex flex-col gap-3">
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
      <fieldset className="flex flex-col gap-2">
        <legend className="text-pine-800 text-sm font-medium">공개 설정</legend>
        <label className="border-line flex items-center gap-3 rounded-lg border px-3 py-3 text-sm">
          <input type="radio" name="isPublic" value="true" defaultChecked />
          공개 · 탐색 목록에 보여요
        </label>
        <label className="border-line flex items-center gap-3 rounded-lg border px-3 py-3 text-sm">
          <input type="radio" name="isPublic" value="false" />
          비공개 · 초대 링크로만 신청할 수 있어요
        </label>
      </fieldset>
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

export function RequestJoinCrewForm({
  crewId,
  inviteCode,
}: {
  crewId?: string;
  inviteCode?: string;
}) {
  const [state, action, pending] = useActionState(requestJoinCrew, initial);

  if (state.ok) {
    return (
      <p className="border-pine-200 bg-pine-50 text-pine-800 rounded-lg border px-3 py-3 text-sm leading-6">
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      {crewId ? <input type="hidden" name="crewId" value={crewId} /> : null}
      {inviteCode ? (
        <input type="hidden" name="inviteCode" value={inviteCode} />
      ) : null}
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-pine-800 font-medium">간단한 소개</span>
        <textarea
          name="message"
          required
          maxLength={200}
          rows={3}
          placeholder="러닝 빈도, 목표, 하고 싶은 말 등을 적어 주세요."
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
        {pending ? "신청 중" : "가입 신청하기"}
      </button>
    </form>
  );
}

export function CreateCrewEntryButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-pine-800 text-fog-50 hover:bg-pine-700 inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold"
      >
        크루 만들기
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="크루 만들기">
        <CreateCrewForm />
      </Modal>
    </>
  );
}
