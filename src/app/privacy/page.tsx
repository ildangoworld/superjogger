import type { Metadata } from "next";
import {
  LegalPublicPage,
  legalPageMetadata,
} from "@/features/legal/components/legal-public-page";

export const metadata: Metadata = legalPageMetadata("PRIVACY");

export default async function PrivacyPage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>;
}) {
  const params = await searchParams;
  return <LegalPublicPage docType="PRIVACY" version={params.v} />;
}
