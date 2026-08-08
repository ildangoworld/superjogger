import { z } from "zod";

export const createInquirySchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "제목을 입력해 주세요.")
    .max(100, "제목은 100자 이하여야 해요."),
  content: z
    .string()
    .trim()
    .min(1, "문의 내용을 입력해 주세요.")
    .max(5000, "문의 내용은 5000자 이하여야 해요."),
});

export const answerInquirySchema = z.object({
  id: z.uuid("문의 정보가 올바르지 않아요."),
  answerContent: z
    .string()
    .trim()
    .min(1, "답변을 입력해 주세요.")
    .max(5000, "답변은 5000자 이하여야 해요."),
});
