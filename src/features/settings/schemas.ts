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
