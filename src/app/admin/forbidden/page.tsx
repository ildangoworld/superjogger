import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { signOutAdmin } from "@/features/admin/actions";

export default function AdminForbiddenPage() {
  return (
    <div className="atmosphere flex min-h-dvh flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-10">
        <Wordmark className="text-xl" />
        <div className="mt-10 flex flex-1 flex-col gap-6">
          <div>
            <h1 className="text-pine-900 text-2xl font-semibold">접근 불가</h1>
            <p className="text-muted mt-2 text-sm leading-relaxed">
              이 계정에는 관리자 권한이 없거나, 요청한 메뉴에 접근할 수 없어요.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href="/welcome"
              className="bg-pine-800 text-fog-50 hover:bg-pine-700 flex h-12 items-center justify-center rounded-lg text-base font-semibold"
            >
              사용자 사이트로 이동
            </Link>
            <form action={signOutAdmin}>
              <button
                type="submit"
                className="border-line text-pine-800 hover:bg-fog-100 h-12 w-full rounded-lg border text-base font-medium"
              >
                로그아웃
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
