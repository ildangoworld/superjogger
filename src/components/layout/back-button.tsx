"use client";

import { useRouter } from "next/navigation";

export function BackButton({
  fallbackHref = "/",
  label = "이전 화면",
}: {
  fallbackHref?: string;
  label?: string;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
          return;
        }
        router.push(fallbackHref);
      }}
      className="text-pine-800 inline-flex items-center gap-1 text-sm font-medium"
    >
      <span aria-hidden>←</span>
      {label}
    </button>
  );
}
