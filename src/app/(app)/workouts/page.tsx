import type { Metadata } from "next";
import { ScreenPlaceholder } from "@/components/layout/screen-placeholder";

export const metadata: Metadata = { title: "기록" };

export default function WorkoutsPage() {
  return (
    <ScreenPlaceholder
      title="기록"
      description="최근 운동 기록과 4주간의 변화를 여기에서 확인할 수 있어요."
      phase="Phase 2"
    />
  );
}
