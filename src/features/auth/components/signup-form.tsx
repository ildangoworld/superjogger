"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signUpWithEmail, type ActionResult } from "@/features/auth/actions";
import { AuthMessage } from "@/features/auth/components/auth-message";
import { GoogleSignInButton } from "@/features/auth/components/google-sign-in-button";

const initial: ActionResult = { ok: false };

type Props = {
  termsVersion: number;
  privacyVersion: number;
};

export function SignupForm({ termsVersion, privacyVersion }: Props) {
  const [state, action, pending] = useActionState(signUpWithEmail, initial);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const consentsAccepted = agreeTerms && agreePrivacy;

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="termsVersion" value={termsVersion} />
        <input type="hidden" name="privacyVersion" value={privacyVersion} />
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-pine-900 font-medium">이메일</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="border-line bg-fog-50 focus:border-pine-500 h-12 rounded-lg border px-3 outline-none"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-pine-900 font-medium">비밀번호</span>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="border-line bg-fog-50 focus:border-pine-500 h-12 rounded-lg border px-3 outline-none"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-pine-900 font-medium">비밀번호 확인</span>
          <input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="border-line bg-fog-50 focus:border-pine-500 h-12 rounded-lg border px-3 outline-none"
          />
        </label>

        <div className="flex flex-col gap-2 text-sm">
          <label className="flex items-start gap-2">
            <input
              name="agreeTerms"
              type="checkbox"
              checked={agreeTerms}
              onChange={(event) => setAgreeTerms(event.target.checked)}
              required
              className="border-line mt-1 size-4 rounded"
            />
            <span className="text-pine-900 leading-6">
              <Link
                href="/terms"
                target="_blank"
                className="text-pine-700 underline-offset-4 hover:underline"
              >
                이용약관
              </Link>
              에 동의합니다. (필수, v{termsVersion})
            </span>
          </label>
          <label className="flex items-start gap-2">
            <input
              name="agreePrivacy"
              type="checkbox"
              checked={agreePrivacy}
              onChange={(event) => setAgreePrivacy(event.target.checked)}
              required
              className="border-line mt-1 size-4 rounded"
            />
            <span className="text-pine-900 leading-6">
              <Link
                href="/privacy"
                target="_blank"
                className="text-pine-700 underline-offset-4 hover:underline"
              >
                개인정보처리방침
              </Link>
              에 동의합니다. (필수, v{privacyVersion})
            </span>
          </label>
        </div>

        <AuthMessage result={state.ok || state.message ? state : null} />
        <button
          type="submit"
          disabled={pending || !consentsAccepted}
          className="bg-pine-800 text-fog-50 hover:bg-pine-700 h-12 rounded-lg text-base font-semibold transition-colors disabled:opacity-60"
        >
          {pending ? "가입 중" : "회원가입"}
        </button>
      </form>

      <GoogleSignInButton
        requireConsent
        consentAccepted={consentsAccepted}
        termsVersion={termsVersion}
        privacyVersion={privacyVersion}
      />

      <p className="text-muted text-sm">
        이미 계정이 있나요?{" "}
        <Link
          href="/login"
          className="text-pine-700 font-medium underline-offset-4 hover:underline"
        >
          로그인
        </Link>
      </p>
    </div>
  );
}
