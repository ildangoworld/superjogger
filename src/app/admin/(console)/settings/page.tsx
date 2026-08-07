import Link from "next/link";
import { requireAdmin } from "@/features/admin/auth";
import { hasAdminPermission } from "@/features/admin/permissions";

export default async function AdminSettingsPage() {
  const admin = await requireAdmin();
  const canManageSettings = hasAdminPermission(admin, "settings");

  return (
    <section className="animate-rise flex max-w-2xl flex-col gap-6">
      <div>
        <h2 className="text-pine-900 text-xl font-semibold">설정</h2>
        <p className="text-muted mt-2 text-sm">
          계정과 운영 설정을 관리합니다.
        </p>
      </div>
      <ul className="flex flex-col gap-3">
        <li>
          <Link
            href="/admin/settings/account"
            className="border-line hover:bg-fog-100 block rounded-lg border px-4 py-3"
          >
            <p className="text-pine-900 font-medium">내 계정</p>
            <p className="text-muted mt-1 text-sm">비밀번호 변경</p>
          </Link>
        </li>
        {canManageSettings ? (
          <li className="border-line rounded-lg border px-4 py-3 opacity-70">
            <p className="text-pine-900 font-medium">AI 설정</p>
            <p className="text-muted mt-1 text-sm">
              모델·일일 한도 설정은 Phase A5에서 제공됩니다.
            </p>
          </li>
        ) : null}
        {admin.role === "SUPER" ? (
          <li className="border-line rounded-lg border px-4 py-3 opacity-70">
            <p className="text-pine-900 font-medium">관리자 계정 관리</p>
            <p className="text-muted mt-1 text-sm">
              관리자 추가·권한 변경은 Phase A5에서 제공됩니다.
            </p>
          </li>
        ) : null}
      </ul>
    </section>
  );
}
