import { z } from "zod";
import { emailSchema } from "@/features/auth/schemas";

export const updateAiSettingsSchema = z.object({
  aiModel: z.string().trim().max(200, "모델명은 200자 이하여야 해요."),
  aiDailyLimit: z.coerce
    .number()
    .int("일일 한도는 정수여야 해요.")
    .min(1, "일일 한도는 1 이상이어야 해요.")
    .max(50, "일일 한도는 50 이하여야 해요."),
  aiBaseUrl: z
    .string()
    .trim()
    .max(500, "Base URL은 500자 이하여야 해요.")
    .refine(
      (value) =>
        value === "" ||
        value.startsWith("https://") ||
        value.startsWith("http://"),
      { message: "Base URL은 http(s)로 시작해야 해요." },
    ),
});

export const updateAiPromptSettingsSchema = z.object({
  systemPrompt: z
    .string()
    .trim()
    .min(1, "시스템 프롬프트를 입력해 주세요.")
    .max(10000, "시스템 프롬프트는 10000자 이하여야 해요."),
  detailRuleDetailed: z
    .string()
    .trim()
    .min(1, "상세 추천 규칙을 입력해 주세요.")
    .max(2000, "상세 추천 규칙은 2000자 이하여야 해요."),
  detailRuleLight: z
    .string()
    .trim()
    .min(1, "간단 추천 규칙을 입력해 주세요.")
    .max(2000, "간단 추천 규칙은 2000자 이하여야 해요."),
  userInstruction: z
    .string()
    .trim()
    .min(1, "사용자 지시문을 입력해 주세요.")
    .max(2000, "사용자 지시문은 2000자 이하여야 해요."),
});

export const addAdminUserSchema = z.object({
  email: emailSchema,
  role: z.enum(["SUPER", "STAFF"]),
  permissions: z.array(
    z.enum([
      "dashboard",
      "members",
      "crews",
      "inquiries",
      "legal",
      "settings",
    ]),
  ),
});

export const updateAdminUserSchema = z.object({
  userId: z.uuid("관리자 정보가 올바르지 않아요."),
  role: z.enum(["SUPER", "STAFF"]),
  permissions: z.array(
    z.enum([
      "dashboard",
      "members",
      "crews",
      "inquiries",
      "legal",
      "settings",
    ]),
  ),
});

export const removeAdminUserSchema = z.object({
  userId: z.uuid("관리자 정보가 올바르지 않아요."),
});
