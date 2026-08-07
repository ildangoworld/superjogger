import { requireAdminPermission } from "@/features/admin/auth";
import { AdminComingSoon } from "@/features/admin/components/admin-coming-soon";

export default async function AdminInquiriesPage() {
  await requireAdminPermission("inquiries");

  return (
    <AdminComingSoon
      title="문의 관리"
      description="문의 목록과 답변은 Phase A4에서 제공됩니다."
    />
  );
}
