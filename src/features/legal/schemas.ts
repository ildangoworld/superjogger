import { z } from "zod";

export const legalDocTypeSchema = z.enum(["TERMS", "PRIVACY"]);

export const legalDraftContentSchema = z
  .string()
  .trim()
  .min(1, "본문을 입력해 주세요.");

export const createLegalDraftSchema = z.object({
  docType: legalDocTypeSchema,
  content: legalDraftContentSchema,
  changeSummary: z.string().trim().max(500, "개정 사유는 500자 이하여야 해요."),
});

export const updateLegalDraftSchema = z.object({
  id: z.uuid("문서 정보가 올바르지 않아요."),
  content: legalDraftContentSchema,
  changeSummary: z.string().trim().max(500, "개정 사유는 500자 이하여야 해요."),
});

export const publishLegalDraftSchema = z.object({
  id: z.uuid("문서 정보가 올바르지 않아요."),
  effectiveDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "시행일을 확인해 주세요."),
  changeSummary: z
    .string()
    .trim()
    .min(1, "개정 사유를 입력해 주세요.")
    .max(500, "개정 사유는 500자 이하여야 해요."),
});

export const signupConsentSchema = z.object({
  agreeTerms: z
    .boolean()
    .refine((value) => value, { message: "이용약관에 동의해 주세요." }),
  agreePrivacy: z
    .boolean()
    .refine((value) => value, {
      message: "개인정보처리방침에 동의해 주세요.",
    }),
  termsVersion: z.coerce.number().int().min(1),
  privacyVersion: z.coerce.number().int().min(1),
});
