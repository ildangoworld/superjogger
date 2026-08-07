import type { Metadata } from "next";
import { ScreenPlaceholder } from "@/components/layout/screen-placeholder";

export const metadata: Metadata = { title: "기록하기" };

export default function RecordPage() {
  return (
    <ScreenPlaceholder
      title="기록하기"
      description="달리기, 걷기, 걷기·달리기 혼합 기록을 여기에서 입력해요."
      phase="Phase 2"
    />
  );
}
