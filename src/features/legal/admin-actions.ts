"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  withAdminPermission,
  writeAdminAuditLog,
} from "@/features/admin/admin-db";
import type { ActionResult } from "@/features/auth/actions";
import {
  createLegalDraftSchema,
  publishLegalDraftSchema,
  updateLegalDraftSchema,
} from "@/features/legal/schemas";
import {
  idsToArchiveOnPublish,
  isLegalDocumentEditable,
  nextLegalVersion,
} from "@/features/legal/publish";
import { mapLegalDocumentRow } from "@/features/legal/map";
import type { LegalDocumentRow } from "@/features/legal/types";

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createLegalDraft(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { admin, db } = await withAdminPermission("legal");
  const parsed = createLegalDraftSchema.safeParse({
    docType: formString(formData, "docType"),
    content: formString(formData, "content"),
    changeSummary: formString(formData, "changeSummary"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.",
    };
  }

  const { data: existing, error: existingError } = await db
    .from("legal_documents")
    .select("doc_type, version")
    .eq("doc_type", parsed.data.docType);

  if (existingError) {
    return { ok: false, message: existingError.message };
  }

  const version = nextLegalVersion(
    (existing ?? []).map((row) => ({
      docType: row.doc_type,
      version: row.version,
    })),
    parsed.data.docType,
  );

  const { data, error } = await db
    .from("legal_documents")
    .insert({
      doc_type: parsed.data.docType,
      version,
      content: parsed.data.content,
      status: "DRAFT",
      change_summary: parsed.data.changeSummary || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, message: error?.message ?? "초안을 만들지 못했어요." };
  }

  await writeAdminAuditLog(db, {
    actorId: admin.userId,
    action: "LEGAL_DRAFT_CREATE",
    targetType: "legal_document",
    targetId: data.id,
    detail: { docType: parsed.data.docType, version },
  });

  revalidatePath("/admin/legal");
  redirect(`/admin/legal/${data.id}`);
}

export async function updateLegalDraft(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { admin, db } = await withAdminPermission("legal");
  const parsed = updateLegalDraftSchema.safeParse({
    id: formString(formData, "id"),
    content: formString(formData, "content"),
    changeSummary: formString(formData, "changeSummary"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.",
    };
  }

  const { data: existing, error: existingError } = await db
    .from("legal_documents")
    .select(
      "id, doc_type, version, content, status, effective_date, change_summary, published_by, published_at, created_at, updated_at",
    )
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (existingError) {
    return { ok: false, message: existingError.message };
  }
  if (!existing) {
    return { ok: false, message: "문서를 찾을 수 없어요." };
  }

  const document = mapLegalDocumentRow(existing as LegalDocumentRow);
  if (!isLegalDocumentEditable(document.status)) {
    return {
      ok: false,
      message: "게시된 문서는 수정할 수 없어요. 새 버전 초안을 만들어 주세요.",
    };
  }

  const { error } = await db
    .from("legal_documents")
    .update({
      content: parsed.data.content,
      change_summary: parsed.data.changeSummary || null,
    })
    .eq("id", parsed.data.id)
    .eq("status", "DRAFT");

  if (error) {
    return { ok: false, message: error.message };
  }

  await writeAdminAuditLog(db, {
    actorId: admin.userId,
    action: "LEGAL_DRAFT_UPDATE",
    targetType: "legal_document",
    targetId: parsed.data.id,
    detail: { docType: document.docType, version: document.version },
  });

  revalidatePath("/admin/legal");
  revalidatePath(`/admin/legal/${parsed.data.id}`);
  return { ok: true, message: "초안을 저장했어요." };
}

export async function publishLegalDraft(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { admin, db } = await withAdminPermission("legal");
  const parsed = publishLegalDraftSchema.safeParse({
    id: formString(formData, "id"),
    effectiveDate: formString(formData, "effectiveDate"),
    changeSummary: formString(formData, "changeSummary"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.",
    };
  }

  const { data: existing, error: existingError } = await db
    .from("legal_documents")
    .select(
      "id, doc_type, version, content, status, effective_date, change_summary, published_by, published_at, created_at, updated_at",
    )
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (existingError) {
    return { ok: false, message: existingError.message };
  }
  if (!existing) {
    return { ok: false, message: "문서를 찾을 수 없어요." };
  }

  const document = mapLegalDocumentRow(existing as LegalDocumentRow);
  if (!isLegalDocumentEditable(document.status)) {
    return { ok: false, message: "초안만 게시할 수 있어요." };
  }
  if (!document.content.trim()) {
    return { ok: false, message: "본문이 비어 있어 게시할 수 없어요." };
  }

  const { data: siblings, error: siblingsError } = await db
    .from("legal_documents")
    .select(
      "id, doc_type, version, content, status, effective_date, change_summary, published_by, published_at, created_at, updated_at",
    )
    .eq("doc_type", document.docType);

  if (siblingsError) {
    return { ok: false, message: siblingsError.message };
  }

  const archiveIds = idsToArchiveOnPublish(
    ((siblings ?? []) as LegalDocumentRow[]).map(mapLegalDocumentRow),
    {
      id: document.id,
      docType: document.docType,
      effectiveDate: parsed.data.effectiveDate,
    },
  );

  if (archiveIds.length > 0) {
    const { error: archiveError } = await db
      .from("legal_documents")
      .update({ status: "ARCHIVED" })
      .in("id", archiveIds)
      .eq("status", "PUBLISHED");

    if (archiveError) {
      return { ok: false, message: archiveError.message };
    }
  }

  const publishedAt = new Date().toISOString();
  const { error: publishError } = await db
    .from("legal_documents")
    .update({
      status: "PUBLISHED",
      effective_date: parsed.data.effectiveDate,
      change_summary: parsed.data.changeSummary,
      published_by: admin.userId,
      published_at: publishedAt,
    })
    .eq("id", document.id)
    .eq("status", "DRAFT");

  if (publishError) {
    return { ok: false, message: publishError.message };
  }

  await writeAdminAuditLog(db, {
    actorId: admin.userId,
    action: "LEGAL_PUBLISH",
    targetType: "legal_document",
    targetId: document.id,
    detail: {
      docType: document.docType,
      version: document.version,
      effectiveDate: parsed.data.effectiveDate,
      archivedIds: archiveIds,
    },
  });

  const publicPath = document.docType === "TERMS" ? "/terms" : "/privacy";
  revalidatePath("/admin/legal");
  revalidatePath(`/admin/legal/${document.id}`);
  revalidatePath(publicPath);
  return {
    ok: true,
    message: `버전 ${document.version}을(를) 게시했어요.`,
  };
}
