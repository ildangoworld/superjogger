import type { Inquiry, InquiryRow } from "@/features/inquiries/types";

export function mapInquiryRow(row: InquiryRow): Inquiry {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    content: row.content,
    status: row.status,
    answerContent: row.answer_content,
    answeredBy: row.answered_by,
    answeredAt: row.answered_at,
    createdAt: row.created_at,
  };
}
