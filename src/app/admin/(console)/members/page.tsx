import { requireAdminPermission } from "@/features/admin/auth";
import { AdminComingSoon } from "@/features/admin/components/admin-coming-soon";

export default async function AdminMembersPage() {
  await requireAdminPermission("members");

  return (
    <AdminComingSoon
      title="회원 관리"
      description="회원 목록·상세·탈퇴 처리는 Phase A2에서 제공됩니다."
    />
  );
}
