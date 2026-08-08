import type { AdminDb } from "@/features/admin/admin-db";

export async function listAdminUserIds(db: AdminDb): Promise<Set<string>> {
  const { data, error } = await db.from("admin_users").select("user_id");
  if (error) {
    throw new Error(error.message);
  }
  return new Set((data ?? []).map((row) => row.user_id));
}

/** PostgREST `not.in` filter value; null when there is nothing to exclude. */
export function notInUserIdsFilter(ids: Iterable<string>): string | null {
  const list = [...ids];
  if (list.length === 0) {
    return null;
  }
  return `(${list.join(",")})`;
}
