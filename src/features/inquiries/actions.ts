"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/features/auth/actions";
import { createInquirySchema } from "@/features/inquiries/schemas";
import { createClient } from "@/lib/supabase/server";

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createInquiry(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = createInquirySchema.safeParse({
    title: formString(formData, "title"),
    content: formString(formData, "content"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "로그인이 필요해요." };
  }

  const { data, error } = await supabase
    .from("inquiries")
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      content: parsed.data.content,
      status: "OPEN",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, message: error?.message ?? "문의를 등록하지 못했어요." };
  }

  revalidatePath("/profile");
  revalidatePath("/admin/inquiries");
  revalidatePath("/admin");
  redirect(`/profile/inquiries/${data.id}`);
}
