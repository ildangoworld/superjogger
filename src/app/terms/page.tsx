import type { Metadata } from "next";
import {
  LegalPublicPage,
  legalPageMetadata,
} from "@/features/legal/components/legal-public-page";

export const metadata: Metadata = legalPageMetadata("TERMS");

export default async function TermsPage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>;
}) {
  const params = await searchParams;
  return <LegalPublicPage docType="TERMS" version={params.v} />;
}
