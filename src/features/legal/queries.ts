import { formatLocalDate } from "@/lib/dates/week";
import { mapLegalDocumentRow } from "@/features/legal/map";
import {
  listPublicLegalHistory,
  resolveEffectiveLegalDocument,
} from "@/features/legal/publish";
import type {
  LegalDocument,
  LegalDocumentRow,
  LegalDocType,
  UserConsent,
} from "@/features/legal/types";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

type DbClient =
  | Awaited<ReturnType<typeof createClient>>
  | ReturnType<typeof createServiceRoleClient>;

function todayInSeoul(): string {
  return formatLocalDate("Asia/Seoul");
}

async function selectDocuments(
  client: DbClient,
  docType?: LegalDocType,
): Promise<LegalDocument[]> {
  let query = client
    .from("legal_documents")
    .select(
      "id, doc_type, version, content, status, effective_date, change_summary, published_by, published_at, created_at, updated_at",
    )
    .order("version", { ascending: false });

  if (docType) {
    query = query.eq("doc_type", docType);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as LegalDocumentRow[]).map(mapLegalDocumentRow);
}

export async function listLegalDocumentsForAdmin(
  docType?: LegalDocType,
): Promise<LegalDocument[]> {
  const db = createServiceRoleClient();
  return selectDocuments(db, docType);
}

export async function getLegalDocumentByIdForAdmin(
  id: string,
): Promise<LegalDocument | null> {
  const db = createServiceRoleClient();
  const { data, error } = await db
    .from("legal_documents")
    .select(
      "id, doc_type, version, content, status, effective_date, change_summary, published_by, published_at, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return null;
  }
  return mapLegalDocumentRow(data as LegalDocumentRow);
}

export async function listPublicLegalDocuments(
  docType: LegalDocType,
): Promise<LegalDocument[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("legal_documents")
    .select(
      "id, doc_type, version, content, status, effective_date, change_summary, published_by, published_at, created_at, updated_at",
    )
    .eq("doc_type", docType)
    .in("status", ["PUBLISHED", "ARCHIVED"])
    .order("version", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as LegalDocumentRow[]).map(mapLegalDocumentRow);
}

export async function getEffectiveLegalDocument(
  docType: LegalDocType,
  today = todayInSeoul(),
): Promise<LegalDocument | null> {
  const documents = await listPublicLegalDocuments(docType);
  return resolveEffectiveLegalDocument(documents, docType, today);
}

export async function getPublicLegalDocumentPage(
  docType: LegalDocType,
  versionParam: string | undefined,
  today = todayInSeoul(),
): Promise<{
  document: LegalDocument | null;
  current: LegalDocument | null;
  history: LegalDocument[];
  viewingHistorical: boolean;
}> {
  const documents = await listPublicLegalDocuments(docType);
  const current = resolveEffectiveLegalDocument(documents, docType, today);

  let document = current;
  let viewingHistorical = false;

  if (versionParam) {
    const version = Number(versionParam);
    if (Number.isFinite(version)) {
      const match = documents.find((doc) => doc.version === version) ?? null;
      document = match;
      viewingHistorical = Boolean(
        match && current && match.version !== current.version,
      );
    }
  }

  const history = listPublicLegalHistory(
    documents,
    docType,
    current?.version ?? null,
  );

  return { document, current, history, viewingHistorical };
}

export async function getCurrentConsentVersions(
  today = todayInSeoul(),
): Promise<{ termsVersion: number; privacyVersion: number } | null> {
  const [terms, privacy] = await Promise.all([
    getEffectiveLegalDocument("TERMS", today),
    getEffectiveLegalDocument("PRIVACY", today),
  ]);

  if (!terms || !privacy) {
    return null;
  }

  return {
    termsVersion: terms.version,
    privacyVersion: privacy.version,
  };
}

export async function listUserConsents(
  client: DbClient,
  userId: string,
): Promise<UserConsent[]> {
  const { data, error } = await client
    .from("user_consents")
    .select("id, user_id, doc_type, version, consented_at")
    .eq("user_id", userId)
    .order("consented_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    docType: row.doc_type as LegalDocType,
    version: row.version,
    consentedAt: row.consented_at,
  }));
}

export async function recordUserConsents(input: {
  userId: string;
  termsVersion: number;
  privacyVersion: number;
  client?: DbClient;
}): Promise<void> {
  const client = input.client ?? (await createClient());
  const rows = [
    {
      user_id: input.userId,
      doc_type: "TERMS" as const,
      version: input.termsVersion,
    },
    {
      user_id: input.userId,
      doc_type: "PRIVACY" as const,
      version: input.privacyVersion,
    },
  ];

  const { error } = await client.from("user_consents").upsert(rows, {
    onConflict: "user_id,doc_type,version",
    ignoreDuplicates: true,
  });

  if (error) {
    throw new Error(error.message);
  }
}
