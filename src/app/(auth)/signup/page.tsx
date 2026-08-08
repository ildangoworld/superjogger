import type { Metadata } from "next";
import { SignupForm } from "@/features/auth/components/signup-form";
import { getCurrentConsentVersions } from "@/features/legal/queries";

export const metadata: Metadata = { title: "회원가입" };

export default async function SignupPage() {
  const versions = await getCurrentConsentVersions();

  if (!versions) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-pine-900 text-2xl font-semibold">회원가입</h1>
        <p className="text-muted text-sm leading-6" role="alert">
          현재 게시된 이용약관·개인정보처리방침이 없어 가입할 수 없어요. 잠시
          후 다시 시도해 주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-pine-900 text-2xl font-semibold">회원가입</h1>
        <p className="text-muted mt-2 text-sm leading-6">
          경쟁 없이, 내가 정한 목표로 시작해요.
        </p>
      </div>
      <SignupForm
        termsVersion={versions.termsVersion}
        privacyVersion={versions.privacyVersion}
      />
    </div>
  );
}
