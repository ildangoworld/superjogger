import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "로그인" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-pine-900 text-2xl font-semibold">로그인</h1>
        <p className="text-muted mt-2 text-sm leading-6">
          나의 페이스로 다시 이어가요.
        </p>
      </div>
      {params.error ? (
        <p
          role="status"
          className="border-dawn-300 bg-dawn-50 text-dawn-900 rounded-lg border px-3 py-2 text-sm"
        >
          {params.error}
        </p>
      ) : null}
      <LoginForm />
    </div>
  );
}
