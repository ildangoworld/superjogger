import { requireAdminPermission } from "@/features/admin/auth";
import { AdminComingSoon } from "@/features/admin/components/admin-coming-soon";

export default async function AdminLegalPage() {
  await requireAdminPermission("legal");

  return (
    <AdminComingSoon
      title="콘텐츠 관리"
      description="이용약관·개인정보처리방침 버전 관리는 Phase A3에서 제공됩니다."
    />
  );
}
