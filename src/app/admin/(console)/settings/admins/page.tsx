import Link from "next/link";
import { requireSuperAdmin } from "@/features/admin/auth";
import {
  AdminAddAdminForm,
  AdminRemoveAdminForm,
  AdminUpdateAdminForm,
} from "@/features/settings/components/admin-admins-forms";
import { listManagedAdmins } from "@/features/settings/admins";
import { createServiceRoleClient } from "@/lib/supabase/server";

export default async function AdminAdminsPage() {
  const current = await requireSuperAdmin();
  const admins = await listManagedAdmins(createServiceRoleClient());

  return (
    <section className="animate-rise flex max-w-3xl flex-col gap-8">
      <div>
        <Link
          href="/admin/settings"
          className="text-pine-700 text-sm underline-offset-4 hover:underline"
        >
          ← 설정
        </Link>
        <h2 className="text-pine-900 mt-3 text-xl font-semibold">
          관리자 계정 관리
        </h2>
        <p className="text-muted mt-2 text-sm">
          기존 회원 이메일로 관리자를 추가하고 역할·메뉴 권한을 변경해요.
        </p>
      </div>

      <AdminAddAdminForm />

      <ul className="flex flex-col gap-4">
        {admins.map((admin) => (
          <li
            key={admin.userId}
            className="border-line flex flex-col gap-4 rounded-lg border p-4"
          >
            <div>
              <p className="text-pine-900 font-medium">
                {admin.email ?? admin.userId}
              </p>
              <p className="text-muted mt-1 text-xs">
                {admin.role}
                {admin.role === "STAFF"
                  ? ` · ${admin.permissions.join(", ") || "권한 없음"}`
                  : " · 전체 권한"}
              </p>
            </div>
            <AdminUpdateAdminForm admin={admin} />
            {admin.userId !== current.userId ? (
              <AdminRemoveAdminForm
                userId={admin.userId}
                email={admin.email}
              />
            ) : (
              <p className="text-muted text-xs">
                본인 계정은 여기서 해제할 수 없어요.
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
