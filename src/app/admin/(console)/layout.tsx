import { requireAdmin } from "@/features/admin/auth";
import { AdminShell } from "@/features/admin/components/admin-shell";

export default async function AdminConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return <AdminShell admin={admin}>{children}</AdminShell>;
}
