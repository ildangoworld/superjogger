import { z } from "zod";

export const emailSchema = z.email("올바른 이메일을 입력해 주세요.");

export const passwordSchema = z
  .string()
  .min(8, "비밀번호는 8자 이상이어야 해요.");

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signupSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
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
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않아요.",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않아요.",
    path: ["confirmPassword"],
  });

export const nicknameSchema = z
  .string()
  .trim()
  .min(2, "닉네임은 2자 이상이어야 해요.")
  .max(20, "닉네임은 20자 이하여야 해요.")
  .regex(
    /^[a-zA-Z0-9가-힣_]+$/,
    "닉네임은 한글, 영문, 숫자, 밑줄만 사용할 수 있어요.",
  );

export const recommendationDetailSchema = z.enum(["LIGHT", "DETAILED"]);

export const experienceLevelSchema = z.enum([
  "BEGINNER",
  "RETURNING",
  "REGULAR",
  "ADVANCED",
]);

export const primaryGoalSchema = z.enum([
  "HABIT",
  "HEALTH",
  "STRESS_RELIEF",
  "ENJOYMENT",
]);

export const onboardingSchema = z.object({
  nickname: nicknameSchema,
  baselineWeeklyFrequency: z.coerce.number().min(0).max(7),
  experienceLevel: experienceLevelSchema,
  primaryGoal: primaryGoalSchema,
  availableWeekdays: z
    .array(z.number().int().min(1).max(7))
    .min(1, "운동 가능한 요일을 하나 이상 선택해 주세요."),
  conditionScore: z.coerce.number().int().min(1).max(5),
  hasPain: z.boolean(),
  recommendationDetail: recommendationDetailSchema,
  targetCount: z.coerce.number().int().min(1).max(7),
  timezone: z.string().min(1),
});

export const profileUpdateSchema = z.object({
  nickname: nicknameSchema,
});

export const recommendationDetailUpdateSchema = z.object({
  recommendationDetail: recommendationDetailSchema,
});
