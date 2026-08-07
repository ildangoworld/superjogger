import type { AdminDb } from "@/features/admin/admin-db";

export type AdminCrewListItem = {
  id: string;
  name: string;
  ownerNickname: string;
  memberCount: number;
  createdAt: string;
};

export type AdminCrewDetail = {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  ownerId: string;
  ownerNickname: string;
  createdAt: string;
  members: Array<{
    userId: string;
    nickname: string;
    role: "OWNER" | "MEMBER";
    joinedAt: string;
  }>;
};

export async function listAdminCrews(
  db: AdminDb,
  query: string,
): Promise<AdminCrewListItem[]> {
  const q = query.trim();

  let crewQuery = db
    .from("crews")
    .select("id, name, owner_id, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (q) {
    crewQuery = crewQuery.ilike("name", `%${q}%`);
  }

  const { data: crews, error } = await crewQuery;
  if (error) {
    throw new Error(error.message);
  }

  const rows = crews ?? [];
  if (rows.length === 0) {
    return [];
  }

  const ownerIds = [...new Set(rows.map((row) => row.owner_id))];
  const crewIds = rows.map((row) => row.id);

  const [{ data: owners, error: ownersError }, { data: members, error: membersError }] =
    await Promise.all([
      db.from("profiles").select("id, nickname").in("id", ownerIds),
      db.from("crew_members").select("crew_id").in("crew_id", crewIds),
    ]);

  if (ownersError) {
    throw new Error(ownersError.message);
  }
  if (membersError) {
    throw new Error(membersError.message);
  }

  const ownerMap = new Map(
    (owners ?? []).map((row) => [row.id, row.nickname]),
  );
  const countMap = new Map<string, number>();
  for (const member of members ?? []) {
    countMap.set(member.crew_id, (countMap.get(member.crew_id) ?? 0) + 1);
  }

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    ownerNickname: ownerMap.get(row.owner_id) ?? "(알 수 없음)",
    memberCount: countMap.get(row.id) ?? 0,
    createdAt: row.created_at,
  }));
}

export async function getAdminCrewDetail(
  db: AdminDb,
  crewId: string,
): Promise<AdminCrewDetail | null> {
  const { data: crew, error } = await db
    .from("crews")
    .select("id, name, description, invite_code, owner_id, created_at")
    .eq("id", crewId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!crew) {
    return null;
  }

  const { data: memberRows, error: membersError } = await db
    .from("crew_members")
    .select("user_id, role, joined_at")
    .eq("crew_id", crewId)
    .order("joined_at", { ascending: true });

  if (membersError) {
    throw new Error(membersError.message);
  }

  const userIds = (memberRows ?? []).map((row) => row.user_id);
  const nicknameMap = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await db
      .from("profiles")
      .select("id, nickname")
      .in("id", userIds);

    if (profilesError) {
      throw new Error(profilesError.message);
    }

    for (const row of profiles ?? []) {
      nicknameMap.set(row.id, row.nickname);
    }
  }

  return {
    id: crew.id,
    name: crew.name,
    description: crew.description,
    inviteCode: crew.invite_code,
    ownerId: crew.owner_id,
    ownerNickname: nicknameMap.get(crew.owner_id) ?? "(알 수 없음)",
    createdAt: crew.created_at,
    members: (memberRows ?? []).map((row) => ({
      userId: row.user_id,
      nickname: nicknameMap.get(row.user_id) ?? "(알 수 없음)",
      role: row.role,
      joinedAt: row.joined_at,
    })),
  };
}
