import type { InquiryStatus } from "@/features/inquiries/types";

export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  OPEN: "답변 대기",
  ANSWERED: "답변 완료",
  CLOSED: "종료",
};

export function isInquiryStatus(value: string): value is InquiryStatus {
  return value === "OPEN" || value === "ANSWERED" || value === "CLOSED";
}

export function inquiryStatusAfterAnswer(
  hasAnswer: boolean,
): InquiryStatus | null {
  if (!hasAnswer) {
    return null;
  }
  return "ANSWERED";
}

export function canUserViewInquiry(
  inquiryUserId: string,
  viewerUserId: string,
): boolean {
  return inquiryUserId === viewerUserId;
}
