import { z } from "zod";
import { passwordSchema } from "@/features/auth/schemas";

export const adminIdSchema = z
  .string()
  .trim()
  .min(1, "아이디를 입력해 주세요.")
  .max(64, "아이디는 64자 이하여야 해요.")
  .regex(
    /^[a-zA-Z0-9._-]+$/,
    "아이디는 영문, 숫자, 점, 밑줄, 하이픈만 사용할 수 있어요.",
  );

export const adminLoginSchema = z.object({
  adminId: adminIdSchema,
  password: passwordSchema,
});

export const adminChangePasswordSchema = z
  .object({
    currentPassword: passwordSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않아요.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.password, {
    message: "새 비밀번호는 현재 비밀번호와 달라야 해요.",
    path: ["password"],
  });
