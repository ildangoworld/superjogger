import type { LegalDocType } from "@/features/legal/types";

export const LEGAL_DOC_TYPES: readonly LegalDocType[] = [
  "TERMS",
  "PRIVACY",
] as const;

export const LEGAL_DOC_LABELS: Record<LegalDocType, string> = {
  TERMS: "이용약관",
  PRIVACY: "개인정보처리방침",
};

export const LEGAL_DOC_PATHS: Record<LegalDocType, string> = {
  TERMS: "/terms",
  PRIVACY: "/privacy",
};

export function isLegalDocType(value: string): value is LegalDocType {
  return (LEGAL_DOC_TYPES as readonly string[]).includes(value);
}
