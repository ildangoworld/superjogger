"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/database.types";

export type CrewActionResult = {
  ok: boolean;
  message?: string;
  crewId?: string;
};

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function asObject(value: Json): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "로그인이 필요해요." as const };
  }
  return { supabase, user };
}

function revalidateCrewPaths(crewId?: string) {
  revalidatePath("/crews");
  revalidatePath("/profile");
  if (crewId) {
    revalidatePath(`/crews/${crewId}`);
  }
}

export async function createCrew(
  _prev: CrewActionResult,
  formData: FormData,
): Promise<CrewActionResult> {
  const name = formString(formData, "name").trim();
  const description = formString(formData, "description").trim();
  const isPublic = formString(formData, "isPublic") !== "false";

  if (!name || name.length > 40) {
    return { ok: false, message: "크루 이름은 1~40자로 입력해 주세요." };
  }
  if (description.length > 200) {
    return { ok: false, message: "소개는 200자 이내로 입력해 주세요." };
  }

  const context = await requireUser();
  if ("error" in context) {
    return { ok: false, message: context.error };
  }

  const { data, error } = await context.supabase.rpc("create_crew", {
    p_name: name,
    p_description: description || null,
    p_is_public: isPublic,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  const result = asObject(data);
  if (!result?.ok) {
    return { ok: false, message: "크루를 만들지 못했어요." };
  }

  const crewId = String(result.crew_id);
  revalidateCrewPaths(crewId);
  redirect(`/crews/${crewId}`);
}

export async function requestJoinCrew(
  _prev: CrewActionResult,
  formData: FormData,
): Promise<CrewActionResult> {
  const crewId = formString(formData, "crewId").trim() || null;
  const inviteCode = formString(formData, "inviteCode").trim() || null;
  const message = formString(formData, "message").trim();

  if (!crewId && !inviteCode) {
    return { ok: false, message: "가입할 크루를 찾지 못했어요." };
  }
  if (message.length > 200) {
    return { ok: false, message: "소개는 200자 이내로 입력해 주세요." };
  }

  const context = await requireUser();
  if ("error" in context) {
    return { ok: false, message: context.error };
  }

  const { data, error } = await context.supabase.rpc("request_join_crew", {
    p_message: message || null,
    p_crew_id: crewId,
    p_invite_code: inviteCode,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  const result = asObject(data);
  if (!result?.ok) {
    const reason = result?.reason;
    if (reason === "ALREADY_MEMBER") {
      return { ok: false, message: "이미 가입한 크루예요." };
    }
    if (reason === "ALREADY_PENDING") {
      return { ok: false, message: "이미 가입 신청을 보냈어요." };
    }
    if (reason === "FORBIDDEN") {
      return { ok: false, message: "이 크루에는 초대로만 신청할 수 있어요." };
    }
    if (reason === "NOT_FOUND") {
      return { ok: false, message: "크루를 찾지 못했어요." };
    }
    return { ok: false, message: "가입 신청을 보내지 못했어요." };
  }

  const resolvedCrewId = String(result.crew_id);
  revalidateCrewPaths(resolvedCrewId);
  return {
    ok: true,
    message: "가입 신청을 보냈어요. 리더가 확인하면 알려드릴게요.",
    crewId: resolvedCrewId,
  };
}

export async function approveJoinRequest(
  _prev: CrewActionResult,
  formData: FormData,
): Promise<CrewActionResult> {
  return decideJoinRequest(formData, "APPROVED");
}

export async function rejectJoinRequest(
  _prev: CrewActionResult,
  formData: FormData,
): Promise<CrewActionResult> {
  return decideJoinRequest(formData, "REJECTED");
}

async function decideJoinRequest(
  formData: FormData,
  decision: "APPROVED" | "REJECTED",
): Promise<CrewActionResult> {
  const requestId = formString(formData, "requestId");
  if (!requestId) {
    return { ok: false, message: "신청을 찾지 못했어요." };
  }

  const context = await requireUser();
  if ("error" in context) {
    return { ok: false, message: context.error };
  }

  const { data, error } = await context.supabase.rpc("decide_crew_join_request", {
    p_request_id: requestId,
    p_decision: decision,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  const result = asObject(data);
  if (!result?.ok) {
    return {
      ok: false,
      message:
        decision === "APPROVED"
          ? "신청을 승인하지 못했어요."
          : "신청을 거절하지 못했어요.",
    };
  }

  const crewId = String(result.crew_id);
  revalidateCrewPaths(crewId);
  return {
    ok: true,
    message: decision === "APPROVED" ? "가입을 승인했어요." : "신청을 거절했어요.",
    crewId,
  };
}

export async function leaveCrew(
  _prev: CrewActionResult,
  formData: FormData,
): Promise<CrewActionResult> {
  const crewId = formString(formData, "crewId");
  if (!crewId) {
    return { ok: false, message: "크루를 찾지 못했어요." };
  }

  const context = await requireUser();
  if ("error" in context) {
    return { ok: false, message: context.error };
  }

  const { supabase, user } = context;

  const { data: crew, error: crewError } = await supabase
    .from("crews")
    .select("id, owner_id")
    .eq("id", crewId)
    .maybeSingle();

  if (crewError || !crew) {
    return { ok: false, message: "크루를 찾지 못했어요." };
  }

  if (crew.owner_id === user.id) {
    const { data: members, error: membersError } = await supabase
      .from("crew_members")
      .select("user_id, joined_at")
      .eq("crew_id", crewId)
      .order("joined_at", { ascending: true });

    if (membersError) {
      return { ok: false, message: membersError.message };
    }

    const others = (members ?? []).filter((row) => row.user_id !== user.id);
    if (others.length === 0) {
      const { error: deleteError } = await supabase
        .from("crews")
        .delete()
        .eq("id", crewId)
        .eq("owner_id", user.id);
      if (deleteError) {
        return { ok: false, message: deleteError.message };
      }
      revalidateCrewPaths(crewId);
      redirect("/crews");
    }

    const nextOwnerId = others[0].user_id;
    const { error: ownerError } = await supabase
      .from("crews")
      .update({ owner_id: nextOwnerId })
      .eq("id", crewId)
      .eq("owner_id", user.id);
    if (ownerError) {
      return { ok: false, message: ownerError.message };
    }

    const { error: roleError } = await supabase
      .from("crew_members")
      .update({ role: "OWNER" })
      .eq("crew_id", crewId)
      .eq("user_id", nextOwnerId);
    if (roleError) {
      return { ok: false, message: roleError.message };
    }
  }

  const { error: leaveError } = await supabase
    .from("crew_members")
    .delete()
    .eq("crew_id", crewId)
    .eq("user_id", user.id);

  if (leaveError) {
    return { ok: false, message: leaveError.message };
  }

  revalidateCrewPaths(crewId);
  redirect("/crews");
}

export async function removeCrewMember(
  _prev: CrewActionResult,
  formData: FormData,
): Promise<CrewActionResult> {
  const crewId = formString(formData, "crewId");
  const memberUserId = formString(formData, "memberUserId");
  if (!crewId || !memberUserId) {
    return { ok: false, message: "구성원을 찾지 못했어요." };
  }

  const context = await requireUser();
  if ("error" in context) {
    return { ok: false, message: context.error };
  }

  const { supabase, user } = context;
  if (memberUserId === user.id) {
    return { ok: false, message: "자신은 내보내기 대신 나가기를 사용해 주세요." };
  }

  const { data: crew, error: crewError } = await supabase
    .from("crews")
    .select("id, owner_id")
    .eq("id", crewId)
    .maybeSingle();

  if (crewError || !crew || crew.owner_id !== user.id) {
    return { ok: false, message: "구성원을 내보낼 권한이 없어요." };
  }

  const { error } = await supabase
    .from("crew_members")
    .delete()
    .eq("crew_id", crewId)
    .eq("user_id", memberUserId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidateCrewPaths(crewId);
  return { ok: true, message: "구성원을 내보냈어요.", crewId };
}
