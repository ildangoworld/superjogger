"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
};

export function Modal({ open, onClose, title, children, wide = false }: Props) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    }
    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      className={`border-line m-auto rounded-xl border bg-white p-0 shadow-lg backdrop:bg-black/40 ${
        wide
          ? "w-[min(100%-2rem,28rem)]"
          : "w-[min(100%-2rem,24rem)]"
      }`}
    >
      <div className="flex max-h-[min(85dvh,40rem)] flex-col">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-transparent px-5 pt-5 pb-2">
          <h2 id={titleId} className="text-pine-900 text-lg font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-pine-800 text-sm"
          >
            닫기
          </button>
        </div>
        <div className="overflow-y-auto px-5 pt-3 pb-5">{children}</div>
      </div>
    </dialog>
  );
}
