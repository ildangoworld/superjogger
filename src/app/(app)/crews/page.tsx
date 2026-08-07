import type { Metadata } from "next";
import { ScreenPlaceholder } from "@/components/layout/screen-placeholder";

export const metadata: Metadata = { title: "크루 현황" };

export default function CrewsPage() {
  return (
    <ScreenPlaceholder
      title="크루 현황"
      description="크루원들의 주간 목표 진행 상황을 여기에서 확인하고 응원할 수 있어요."
      phase="Phase 5"
    />
  );
}
