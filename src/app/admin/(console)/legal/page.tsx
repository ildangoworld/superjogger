import Link from "next/link";
import { withAdminPermission } from "@/features/admin/admin-db";
import { AdminCreateLegalDraftForm } from "@/features/legal/components/admin-legal-forms";
import { LEGAL_DOC_LABELS, LEGAL_DOC_TYPES } from "@/features/legal/constants";
import { listLegalDocumentsForAdmin } from "@/features/legal/queries";
import { resolveEffectiveLegalDocument } from "@/features/legal/publish";
import { formatLocalDate } from "@/lib/dates/week";
import type { LegalDocType } from "@/features/legal/types";

function statusLabel(status: string): string {
  switch (status) {
    case "DRAFT":
      return "초안";
    case "PUBLISHED":
      return "게시";
    case "ARCHIVED":
      return "이력";
    default:
      return status;
  }
}

function formatDate(iso: string | null): string {
  if (!iso) {
    return "—";
  }
  return iso;
}

export default async function AdminLegalPage() {
  await withAdminPermission("legal");
  const documents = await listLegalDocumentsForAdmin();
  const today = formatLocalDate("Asia/Seoul");

  return (
    <div className="animate-rise flex flex-col gap-10">
      <div>
        <h2 className="text-pine-900 text-xl font-semibold">콘텐츠 관리</h2>
        <p className="text-muted mt-1 text-sm">
          이용약관·개인정보처리방침 버전을 관리해요. 게시된 문서는 수정할 수
          없고 새 버전으로 개정해요.
        </p>
      </div>

      {LEGAL_DOC_TYPES.map((docType) => {
        const rows = documents.filter((doc) => doc.docType === docType);
        const current = resolveEffectiveLegalDocument(rows, docType, today);
        const latestContent =
          rows.find((doc) => doc.status !== "DRAFT")?.content ??
          rows[0]?.content ??
          "";

        return (
          <section key={docType} className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="text-pine-900 text-lg font-semibold">
                  {LEGAL_DOC_LABELS[docType]}
                </h3>
                <p className="text-muted mt-1 text-sm">
                  현재 적용:{" "}
                  {current
                    ? `버전 ${current.version} (시행 ${current.effectiveDate})`
                    : "없음"}
                </p>
              </div>
            </div>

            <div className="border-line overflow-x-auto rounded-lg border">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-fog-100 text-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">버전</th>
                    <th className="px-3 py-2 font-medium">상태</th>
                    <th className="px-3 py-2 font-medium">시행일</th>
                    <th className="px-3 py-2 font-medium">개정 사유</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-line)]">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-muted px-3 py-4">
                        문서가 없어요.
                      </td>
                    </tr>
                  ) : (
                    rows.map((doc) => (
                      <tr key={doc.id} className="hover:bg-fog-100/60">
                        <td className="px-3 py-2.5">
                          <Link
                            href={`/admin/legal/${doc.id}`}
                            className="text-pine-800 font-medium underline-offset-4 hover:underline"
                          >
                            v{doc.version}
                          </Link>
                          {current?.id === doc.id ? (
                            <span className="text-pine-600 ml-2 text-xs">
                              적용 중
                            </span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2.5">
                          {statusLabel(doc.status)}
                        </td>
                        <td className="px-3 py-2.5">
                          {formatDate(doc.effectiveDate)}
                        </td>
                        <td className="text-muted px-3 py-2.5">
                          {doc.changeSummary ?? "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <details className="border-line rounded-lg border px-4 py-3">
              <summary className="text-pine-800 cursor-pointer text-sm font-medium">
                새 버전 초안 만들기
              </summary>
              <div className="mt-4">
                <AdminCreateLegalDraftForm
                  docType={docType as LegalDocType}
                  defaultContent={latestContent}
                />
              </div>
            </details>
          </section>
        );
      })}
    </div>
  );
}
