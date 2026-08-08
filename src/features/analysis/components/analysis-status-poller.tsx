"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { AnalysisStatus } from "@/features/analysis/types";

const POLL_MS = 2500;
const MAX_POLL_MS = 120_000;

export function AnalysisStatusPoller({
  status,
  expectPending,
}: {
  status: AnalysisStatus | null;
  expectPending?: boolean;
}) {
  const router = useRouter();
  const shouldPoll = status === "PENDING" || (expectPending && !status);

  useEffect(() => {
    if (!shouldPoll) {
      return;
    }

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      if (Date.now() - startedAt >= MAX_POLL_MS) {
        window.clearInterval(timer);
        return;
      }
      router.refresh();
    }, POLL_MS);

    return () => window.clearInterval(timer);
  }, [shouldPoll, router]);

  return null;
}
