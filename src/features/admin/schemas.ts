import { z } from "zod";
import { emailSchema, passwordSchema } from "@/features/auth/schemas";

export const adminLoginSchema = z.object({
  email: emailSchema,
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
