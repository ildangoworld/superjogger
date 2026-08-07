import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = { title: "비밀번호 재설정" };

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-pine-900 text-2xl font-semibold">
          비밀번호 재설정
        </h1>
        <p className="text-muted mt-2 text-sm leading-6">
          가입한 이메일로 재설정 링크를 보내드릴게요.
        </p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
