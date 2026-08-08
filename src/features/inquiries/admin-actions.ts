"use server";

import { revalidatePath } from "next/cache";
import {
  withAdminPermission,
  writeAdminAuditLog,
} from "@/features/admin/admin-db";
import type { ActionResult } from "@/features/auth/actions";
import { answerInquirySchema } from "@/features/inquiries/schemas";
import { inquiryStatusAfterAnswer } from "@/features/inquiries/status";

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function answerInquiry(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { admin, db } = await withAdminPermission("inquiries");
  const parsed = answerInquirySchema.safeParse({
    id: formString(formData, "id"),
    answerContent: formString(formData, "answerContent"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.",
    };
  }

  const status = inquiryStatusAfterAnswer(true);
  if (!status) {
    return { ok: false, message: "답변을 입력해 주세요." };
  }

  const answeredAt = new Date().toISOString();
  const { data, error } = await db
    .from("inquiries")
    .update({
      answer_content: parsed.data.answerContent,
      status,
      answered_by: admin.userId,
      answered_at: answeredAt,
    })
    .eq("id", parsed.data.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }
  if (!data) {
    return { ok: false, message: "문의를 찾을 수 없어요." };
  }

  await writeAdminAuditLog(db, {
    actorId: admin.userId,
    action: "INQUIRY_ANSWER",
    targetType: "inquiry",
    targetId: parsed.data.id,
  });

  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${parsed.data.id}`);
  revalidatePath("/admin");
  revalidatePath("/profile");
  return { ok: true, message: "답변을 저장했어요." };
}
