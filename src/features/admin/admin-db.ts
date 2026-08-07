import { requireAdminPermission } from "@/features/admin/auth";
import type { AdminPermissionKey, AdminUser } from "@/features/admin/types";
import type { Json } from "@/lib/database.types";
import { createServiceRoleClient } from "@/lib/supabase/server";

export type AdminDb = ReturnType<typeof createServiceRoleClient>;

export async function withAdminPermission(
  permission: AdminPermissionKey,
): Promise<{ admin: AdminUser; db: AdminDb }> {
  const admin = await requireAdminPermission(permission);
  return { admin, db: createServiceRoleClient() };
}

export async function writeAdminAuditLog(
  db: AdminDb,
  input: {
    actorId: string;
    action: string;
    targetType: string;
    targetId?: string | null;
    detail?: Record<string, unknown>;
  },
): Promise<void> {
  const { error } = await db.from("admin_audit_logs").insert({
    actor_id: input.actorId,
    action: input.action,
    target_type: input.targetType,
    target_id: input.targetId ?? null,
    detail: (input.detail ?? {}) as Json,
  });

  if (error) {
    throw new Error(error.message);
  }
}
