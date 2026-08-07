import { requireAdminPermission } from "@/features/admin/auth";
import { AdminComingSoon } from "@/features/admin/components/admin-coming-soon";

export default async function AdminCrewsPage() {
  await requireAdminPermission("crews");

  return (
    <AdminComingSoon
      title="크루 관리"
      description="크루 목록·상세·초대 코드 재발급은 Phase A2에서 제공됩니다."
    />
  );
}
