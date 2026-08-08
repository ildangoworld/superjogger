import { AdminLoginForm } from "@/features/admin/components/admin-login-form";
import { Wordmark } from "@/components/brand/wordmark";

export default function AdminLoginPage() {
  return (
    <div className="atmosphere flex min-h-dvh flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-10">
        <Wordmark className="text-xl" />
        <p className="text-muted mt-2 text-sm">관리자</p>
        <div className="mt-10 flex flex-1 flex-col gap-6">
          <div>
            <h1 className="text-pine-900 text-2xl font-semibold">로그인</h1>
            <p className="text-muted mt-2 text-sm">
              관리자 아이디와 비밀번호로 로그인해 주세요.
            </p>
          </div>
          <AdminLoginForm />
        </div>
      </div>
    </div>
  );
}
