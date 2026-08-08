"use client";

import { useActionState, useState } from "react";
import { Modal } from "@/components/layout/modal";
import {
  createCrew,
  joinCrew,
  type CrewActionResult,
} from "@/features/crews/actions";

const initial: CrewActionResult = { ok: false };

type ModalKind = "create" | "join" | null;

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
        className="bg-pine-800 text-fog-50 hover:bg-pine-700 h-11 rounded-lg font-semibold disabled:opacity-60"
      >
        {pending ? "가입 중" : "크루 가입"}
      </button>
    </form>
  );
}

export function CrewEntryActions() {
  const [modal, setModal] = useState<ModalKind>(null);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setModal("create")}
          className="border-line text-pine-800 hover:bg-pine-50 h-11 rounded-lg border px-4 text-sm font-medium"
        >
          크루 만들기
        </button>
        <button
          type="button"
          onClick={() => setModal("join")}
          className="border-line text-pine-800 hover:bg-pine-50 h-11 rounded-lg border px-4 text-sm font-medium"
        >
          초대 코드로 가입
        </button>
      </div>

      <Modal
        open={modal === "create"}
        onClose={() => setModal(null)}
        title="크루 만들기"
      >
        <CreateCrewForm />
      </Modal>

      <Modal
        open={modal === "join"}
        onClose={() => setModal(null)}
        title="초대 코드로 가입"
      >
        <JoinCrewForm />
      </Modal>
    </>
  );
}
