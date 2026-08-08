"use client";

import { useRouter } from "next/navigation";
import { startTransition, useActionState, useState } from "react";
import type { ActionResult } from "@/features/auth/actions";
import { AuthMessage } from "@/features/auth/components/auth-message";
import { Modal } from "@/components/layout/modal";
import { createInquiry } from "@/features/inquiries/actions";
import { INQUIRY_STATUS_LABELS } from "@/features/inquiries/status";
import type { Inquiry } from "@/features/inquiries/types";

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

const initial: ActionResult = { ok: false };

export function ProfileInquiriesSection({
  inquiries,
}: {
  inquiries: Inquiry[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [state, action, pending] = useActionState(
    async (prev: ActionResult, formData: FormData) => {
      const result = await createInquiry(prev, formData);
      if (result.ok) {
        startTransition(() => {
          router.refresh();
        });
      }
      return result;
    },
    initial,
  );

  const selected = selectedId
    ? (inquiries.find((item) => item.id === selectedId) ?? null)
    : null;

  function closeModal() {
    setOpen(false);
    setSelectedId(null);
  }

  return (
    <>
      <section className="border-line flex items-center gap-3 rounded-xl border bg-white/60 px-4 py-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-pine-900 text-base font-semibold">문의하기</h2>
          <p className="text-muted mt-0.5 truncate text-sm">
            {inquiries.length === 0
              ? "등록한 문의가 없어요"
              : `문의 ${inquiries.length}건`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="border-line text-pine-800 hover:bg-pine-50 shrink-0 rounded-lg border px-3 py-2 text-sm font-medium"
        >
          열기
        </button>
      </section>

      <Modal
        open={open}
        onClose={closeModal}
        title={selected ? "문의 상세" : "문의하기"}
        wide
      >
        {selected ? (
          <div className="flex flex-col gap-6">
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="text-pine-700 self-start text-sm underline-offset-4 hover:underline"
            >
              ← 목록으로
            </button>
            <div>
              <h3 className="text-pine-900 text-lg font-semibold">
                {selected.title}
              </h3>
              <p className="text-muted mt-2 text-sm">
                {INQUIRY_STATUS_LABELS[selected.status]} ·{" "}
                {formatDateTime(selected.createdAt)}
              </p>
            </div>
            <section>
              <h4 className="text-pine-900 text-sm font-semibold">문의 내용</h4>
              <p className="text-muted mt-2 whitespace-pre-wrap text-sm leading-7">
                {selected.content}
              </p>
            </section>
            <section>
              <h4 className="text-pine-900 text-sm font-semibold">답변</h4>
              {selected.answerContent ? (
                <>
                  <p className="text-muted mt-2 whitespace-pre-wrap text-sm leading-7">
                    {selected.answerContent}
                  </p>
                  {selected.answeredAt ? (
                    <p className="text-muted mt-2 text-xs">
                      {formatDateTime(selected.answeredAt)}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-muted mt-2 text-sm leading-7">
                  아직 답변이 없어요. 확인되는 대로 답변드릴게요.
                </p>
              )}
            </section>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <p className="text-muted text-sm leading-6">
              서비스 이용 중 궁금한 점을 남겨 주세요. 답변이 오면 여기서 확인할
              수 있어요.
            </p>

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

            <div>
              <h3 className="text-pine-900 text-base font-semibold">내 문의</h3>
              {inquiries.length === 0 ? (
                <p className="text-muted mt-2 text-sm">
                  아직 등록한 문의가 없어요.
                </p>
              ) : (
                <ul className="border-line mt-3 divide-y rounded-lg border">
                  {inquiries.map((inquiry) => (
                    <li key={inquiry.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(inquiry.id)}
                        className="hover:bg-fog-100/60 flex w-full flex-col gap-1 px-4 py-3 text-left"
                      >
                        <span className="text-pine-900 text-sm font-medium">
                          {inquiry.title}
                        </span>
                        <span className="text-muted text-xs">
                          {INQUIRY_STATUS_LABELS[inquiry.status]} ·{" "}
                          {formatDateTime(inquiry.createdAt)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
