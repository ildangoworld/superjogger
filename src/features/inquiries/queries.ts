import type { AdminDb } from "@/features/admin/admin-db";
import { mapInquiryRow } from "@/features/inquiries/map";
import { isInquiryStatus } from "@/features/inquiries/status";
import type {
  AdminInquiryDetail,
  AdminInquiryListItem,
  Inquiry,
  InquiryRow,
  InquiryStatus,
} from "@/features/inquiries/types";
import { createClient } from "@/lib/supabase/server";

type UserClient = Awaited<ReturnType<typeof createClient>>;

export async function listMyInquiries(
  client: UserClient,
  userId: string,
): Promise<Inquiry[]> {
  const { data, error } = await client
    .from("inquiries")
    .select(
      "id, user_id, title, content, status, answer_content, answered_by, answered_at, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as InquiryRow[]).map(mapInquiryRow);
}

export async function getMyInquiry(
  client: UserClient,
  userId: string,
  inquiryId: string,
): Promise<Inquiry | null> {
  const { data, error } = await client
    .from("inquiries")
    .select(
      "id, user_id, title, content, status, answer_content, answered_by, answered_at, created_at",
    )
    .eq("id", inquiryId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return null;
  }
  return mapInquiryRow(data as InquiryRow);
}

export async function listAdminInquiries(
  db: AdminDb,
  statusFilter: InquiryStatus | "ALL",
): Promise<AdminInquiryListItem[]> {
  let query = db
    .from("inquiries")
    .select(
      "id, user_id, title, content, status, answer_content, answered_by, answered_at, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (statusFilter !== "ALL") {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as InquiryRow[];
  const userIds = [...new Set(rows.map((row) => row.user_id))];
  const nicknameById = new Map<string, string>();
  const emailById = new Map<string, string | null>();

  if (userIds.length > 0) {
    const { data: profiles, error: profileError } = await db
      .from("profiles")
      .select("id, nickname")
      .in("id", userIds);
    if (profileError) {
      throw new Error(profileError.message);
    }
    for (const profile of profiles ?? []) {
      nicknameById.set(profile.id, profile.nickname);
    }

    await Promise.all(
      userIds.map(async (userId) => {
        const { data, error: authError } = await db.auth.admin.getUserById(
          userId,
        );
        if (authError) {
          emailById.set(userId, null);
          return;
        }
        emailById.set(userId, data.user.email ?? null);
      }),
    );
  }

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    createdAt: row.created_at,
    userId: row.user_id,
    authorNickname: nicknameById.get(row.user_id) ?? "알 수 없음",
    authorEmail: emailById.get(row.user_id) ?? null,
  }));
}

export async function getAdminInquiryDetail(
  db: AdminDb,
  inquiryId: string,
): Promise<AdminInquiryDetail | null> {
  const { data, error } = await db
    .from("inquiries")
    .select(
      "id, user_id, title, content, status, answer_content, answered_by, answered_at, created_at",
    )
    .eq("id", inquiryId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return null;
  }

  const inquiry = mapInquiryRow(data as InquiryRow);

  const { data: profile, error: profileError } = await db
    .from("profiles")
    .select("nickname")
    .eq("id", inquiry.userId)
    .maybeSingle();
  if (profileError) {
    throw new Error(profileError.message);
  }

  const { data: authUser, error: authError } = await db.auth.admin.getUserById(
    inquiry.userId,
  );
  if (authError) {
    throw new Error(authError.message);
  }

  return {
    ...inquiry,
    authorNickname: profile?.nickname ?? "알 수 없음",
    authorEmail: authUser.user.email ?? null,
  };
}

export async function listRecentAdminInquiries(
  db: AdminDb,
  limit = 5,
): Promise<AdminInquiryListItem[]> {
  const { data, error } = await db
    .from("inquiries")
    .select(
      "id, user_id, title, content, status, answer_content, answered_by, answered_at, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as InquiryRow[];
  const userIds = [...new Set(rows.map((row) => row.user_id))];
  const nicknameById = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: profiles, error: profileError } = await db
      .from("profiles")
      .select("id, nickname")
      .in("id", userIds);
    if (profileError) {
      throw new Error(profileError.message);
    }
    for (const profile of profiles ?? []) {
      nicknameById.set(profile.id, profile.nickname);
    }
  }

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    createdAt: row.created_at,
    userId: row.user_id,
    authorNickname: nicknameById.get(row.user_id) ?? "알 수 없음",
    authorEmail: null,
  }));
}

export function parseInquiryStatusFilter(
  value: string | undefined,
): InquiryStatus | "ALL" {
  if (!value || value === "ALL") {
    return "ALL";
  }
  if (isInquiryStatus(value)) {
    return value;
  }
  return "ALL";
}
