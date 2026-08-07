import { redirect } from "next/navigation";
import { requireAdmin } from "@/features/admin/auth";
import { AdminComingSoon } from "@/features/admin/components/admin-coming-soon";
import { ADMIN_MENU_ITEMS } from "@/features/admin/menu";
import {
  filterAdminMenuItems,
  hasAdminPermission,
} from "@/features/admin/permissions";

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();

  if (!hasAdminPermission(admin, "dashboard")) {
    const visible = filterAdminMenuItems(admin, ADMIN_MENU_ITEMS).filter(
      (item) => item.key !== "dashboard",
    );
    redirect(visible[0]?.href ?? "/admin/settings/account");
  }

  return (
    <AdminComingSoon
      title="대시보드"
      description="회원·운동·AI 사용 지표는 Phase A2에서 연결됩니다. 관리자 인증과 메뉴 권한은 동작 중입니다."
    />
  );
}
