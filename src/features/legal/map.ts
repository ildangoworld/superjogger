import type {
  LegalDocument,
  LegalDocumentRow,
} from "@/features/legal/types";

export function mapLegalDocumentRow(row: LegalDocumentRow): LegalDocument {
  return {
    id: row.id,
    docType: row.doc_type,
    version: row.version,
    content: row.content,
    status: row.status,
    effectiveDate: row.effective_date,
    changeSummary: row.change_summary,
    publishedBy: row.published_by,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
