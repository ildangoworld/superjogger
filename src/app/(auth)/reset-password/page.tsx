import type { Metadata } from "next";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = { title: "새 비밀번호" };

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-pine-900 text-2xl font-semibold">새 비밀번호</h1>
        <p className="text-muted mt-2 text-sm leading-6">
          앞으로 사용할 비밀번호를 입력해 주세요.
        </p>
      </div>
      <ResetPasswordForm />
    </div>
  );
}
