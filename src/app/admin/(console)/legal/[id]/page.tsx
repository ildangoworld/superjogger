import Link from "next/link";
import { notFound } from "next/navigation";
import { withAdminPermission } from "@/features/admin/admin-db";
import {
  AdminPublishLegalDraftForm,
  AdminUpdateLegalDraftForm,
} from "@/features/legal/components/admin-legal-forms";
import { LegalMarkdown } from "@/features/legal/components/legal-markdown";
import { LEGAL_DOC_LABELS } from "@/features/legal/constants";
import { getLegalDocumentByIdForAdmin } from "@/features/legal/queries";
import { isLegalDocumentEditable } from "@/features/legal/publish";

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

export default async function AdminLegalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await withAdminPermission("legal");
  const document = await getLegalDocumentByIdForAdmin(id);

  if (!document) {
    notFound();
  }

  const editable = isLegalDocumentEditable(document.status);

  return (
    <div className="animate-rise flex max-w-3xl flex-col gap-8">
      <div>
        <Link
          href="/admin/legal"
          className="text-pine-700 text-sm underline-offset-4 hover:underline"
        >
          ← 콘텐츠 관리
        </Link>
        <h2 className="text-pine-900 mt-3 text-xl font-semibold">
          {LEGAL_DOC_LABELS[document.docType]} v{document.version}
        </h2>
        <p className="text-muted mt-1 text-sm">
          {statusLabel(document.status)}
          {document.effectiveDate
            ? ` · 시행일 ${document.effectiveDate}`
            : null}
        </p>
      </div>

      {editable ? (
        <>
          <AdminUpdateLegalDraftForm document={document} />
          <AdminPublishLegalDraftForm document={document} />
        </>
      ) : (
        <section>
          <p className="text-muted mb-4 text-sm">
            게시된 문서는 수정할 수 없어요. 내용 변경이 필요하면 새 버전 초안을
            만들어 주세요.
          </p>
          {document.changeSummary ? (
            <p className="text-muted mb-4 text-sm">
              개정 사유: {document.changeSummary}
            </p>
          ) : null}
          <LegalMarkdown content={document.content} />
        </section>
      )}
    </div>
  );
}
