"use client";

import { useRouter } from "next/navigation";

export function LegalBackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
          return;
        }
        router.push("/");
      }}
      className="text-pine-700 self-start text-sm underline-offset-4 hover:underline"
    >
      ← 이전 화면
    </button>
  );
}
