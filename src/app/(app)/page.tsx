import type { Metadata } from "next";
import { ScreenPlaceholder } from "@/components/layout/screen-placeholder";

export const metadata: Metadata = { title: "홈" };

export default function HomePage() {
  return (
    <ScreenPlaceholder
      title="홈"
      description="이번 주 목표와 진행도, 다음 운동 추천이 여기에 표시돼요."
      phase="Phase 3"
    />
  );
}
