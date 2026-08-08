import type {
  LegalDocument,
  LegalDocumentStatus,
  LegalDocType,
} from "@/features/legal/types";

export type LegalVersionSummary = Pick<
  LegalDocument,
  "id" | "docType" | "version" | "status" | "effectiveDate"
>;

export function isLegalDocumentEditable(status: LegalDocumentStatus): boolean {
  return status === "DRAFT";
}

export function resolveEffectiveLegalDocument<T extends LegalVersionSummary>(
  documents: T[],
  docType: LegalDocType,
  today: string,
): T | null {
  const candidates = documents.filter(
    (doc) =>
      doc.docType === docType &&
      doc.status !== "DRAFT" &&
      doc.effectiveDate != null &&
      doc.effectiveDate <= today,
  );

  if (candidates.length === 0) {
    return null;
  }

  return candidates.reduce((best, current) =>
    current.version > best.version ? current : best,
  );
}

export function listPublicLegalHistory<T extends LegalVersionSummary>(
  documents: T[],
  docType: LegalDocType,
  currentVersion: number | null,
): T[] {
  return documents
    .filter(
      (doc) =>
        doc.docType === docType &&
        doc.status !== "DRAFT" &&
        (currentVersion == null || doc.version !== currentVersion),
    )
    .sort((a, b) => b.version - a.version);
}

export function nextLegalVersion(
  documents: Array<Pick<LegalDocument, "docType" | "version">>,
  docType: LegalDocType,
): number {
  const versions = documents
    .filter((doc) => doc.docType === docType)
    .map((doc) => doc.version);
  if (versions.length === 0) {
    return 1;
  }
  return Math.max(...versions) + 1;
}

/**
 * When publishing a document that is already effective (or becomes effective
 * today), archive other published docs of the same type whose effective date
 * is on or before the new effective date. Future-scheduled published docs with
 * a later effective date are left alone until they take effect or are replaced.
 */
export function idsToArchiveOnPublish(
  documents: LegalVersionSummary[],
  publishing: Pick<LegalVersionSummary, "id" | "docType" | "effectiveDate">,
): string[] {
  if (!publishing.effectiveDate) {
    return [];
  }

  return documents
    .filter(
      (doc) =>
        doc.id !== publishing.id &&
        doc.docType === publishing.docType &&
        doc.status === "PUBLISHED" &&
        doc.effectiveDate != null &&
        doc.effectiveDate <= publishing.effectiveDate!,
    )
    .map((doc) => doc.id);
}
