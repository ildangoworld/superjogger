import type { Metadata } from "next";
import { SignupForm } from "@/features/auth/components/signup-form";

export const metadata: Metadata = { title: "회원가입" };

export default function SignupPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-pine-900 text-2xl font-semibold">회원가입</h1>
        <p className="text-muted mt-2 text-sm leading-6">
          경쟁 없이, 내가 정한 목표로 시작해요.
        </p>
      </div>
      <SignupForm />
    </div>
  );
}
