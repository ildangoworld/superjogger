import { requireAdmin } from "@/features/admin/auth";
import { AdminChangePasswordForm } from "@/features/admin/components/admin-change-password-form";

export default async function AdminAccountPage() {
  const admin = await requireAdmin();

  return (
    <section className="animate-rise flex flex-col gap-6">
      <div>
        <h2 className="text-pine-900 text-xl font-semibold">내 계정</h2>
        <p className="text-muted mt-2 text-sm">
          {admin.email ?? admin.userId} · {admin.role}
        </p>
      </div>
      <div>
        <h3 className="text-pine-900 mb-3 text-base font-medium">
          비밀번호 변경
        </h3>
        <AdminChangePasswordForm />
      </div>
    </section>
  );
}
