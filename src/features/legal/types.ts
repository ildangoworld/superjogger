export type LegalDocType = "TERMS" | "PRIVACY";

export type LegalDocumentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type LegalDocument = {
  id: string;
  docType: LegalDocType;
  version: number;
  content: string;
  status: LegalDocumentStatus;
  effectiveDate: string | null;
  changeSummary: string | null;
  publishedBy: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UserConsent = {
  id: string;
  userId: string;
  docType: LegalDocType;
  version: number;
  consentedAt: string;
};

export type LegalDocumentRow = {
  id: string;
  doc_type: LegalDocType;
  version: number;
  content: string;
  status: LegalDocumentStatus;
  effective_date: string | null;
  change_summary: string | null;
  published_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};
