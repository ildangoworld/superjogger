import Link from "next/link";
import type { Metadata } from "next";
import { Wordmark } from "@/components/brand/wordmark";
import { LegalBackButton } from "@/features/legal/components/legal-back-button";
import { LegalFooterLinks } from "@/features/legal/components/legal-footer-links";
import { LegalMarkdown } from "@/features/legal/components/legal-markdown";
import { LEGAL_DOC_LABELS, LEGAL_DOC_PATHS } from "@/features/legal/constants";
import { getPublicLegalDocumentPage } from "@/features/legal/queries";
import type { LegalDocType } from "@/features/legal/types";

type Props = {
  docType: LegalDocType;
  version?: string;
};

export function legalPageMetadata(docType: LegalDocType): Metadata {
  return { title: LEGAL_DOC_LABELS[docType] };
}

export async function LegalPublicPage({ docType, version }: Props) {
  const { document, current, history, viewingHistorical } =
    await getPublicLegalDocumentPage(docType, version);
  const path = LEGAL_DOC_PATHS[docType];

  return (
    <div className="atmosphere flex min-h-dvh flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-10">
        <header className="flex flex-col gap-4">
          <LegalBackButton />
          <Link href="/" className="self-start" aria-label="홈으로 이동">
            <Wordmark className="text-xl" />
          </Link>
        </header>
        <main className="mt-10 flex flex-1 flex-col">
          <h1 className="text-pine-900 text-2xl font-semibold">
            {LEGAL_DOC_LABELS[docType]}
          </h1>
          {document ? (
            <>
              <p className="text-muted mt-2 text-sm">
                버전 {document.version}
                {document.effectiveDate
                  ? ` · 시행일 ${document.effectiveDate}`
                  : null}
                {viewingHistorical ? " · 이전 버전" : null}
              </p>
              {viewingHistorical && current ? (
                <p className="mt-3 text-sm">
                  <Link
                    href={path}
                    className="text-pine-700 underline-offset-4 hover:underline"
                  >
                    현재 적용 버전(v{current.version}) 보기
                  </Link>
                </p>
              ) : null}
              <div className="mt-6">
                <LegalMarkdown content={document.content} />
              </div>
            </>
          ) : (
            <p className="text-muted mt-4 text-sm leading-7">
              게시된 문서가 아직 없어요.
            </p>
          )}

          {history.length > 0 ? (
            <section className="border-line mt-12 border-t pt-8">
              <h2 className="text-pine-900 text-base font-semibold">
                이전 버전
              </h2>
              <ul className="mt-3 flex flex-col gap-2">
                {history.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`${path}?v=${item.version}`}
                      className="text-pine-700 text-sm underline-offset-4 hover:underline"
                    >
                      버전 {item.version}
                      {item.effectiveDate
                        ? ` (시행 ${item.effectiveDate})`
                        : ""}
                      {item.status === "PUBLISHED" &&
                      item.effectiveDate &&
                      current &&
                      item.version > current.version
                        ? " · 예정"
                        : ""}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </main>
        <footer className="border-line mt-12 border-t pt-6">
          <LegalFooterLinks />
        </footer>
      </div>
    </div>
  );
}
