import Link from "next/link";
import { notFound } from "next/navigation";
import { withAdminPermission } from "@/features/admin/admin-db";
import { AdminAnswerInquiryForm } from "@/features/inquiries/components/admin-answer-inquiry-form";
import { INQUIRY_STATUS_LABELS } from "@/features/inquiries/status";
import { getAdminInquiryDetail } from "@/features/inquiries/queries";

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default async function AdminInquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { db } = await withAdminPermission("inquiries");
  const inquiry = await getAdminInquiryDetail(db, id);

  if (!inquiry) {
    notFound();
  }

  return (
    <div className="animate-rise flex max-w-3xl flex-col gap-8">
      <div>
        <Link
          href="/admin/inquiries"
          className="text-pine-700 text-sm underline-offset-4 hover:underline"
        >
          ← 문의 목록
        </Link>
        <h2 className="text-pine-900 mt-3 text-xl font-semibold">
          {inquiry.title}
        </h2>
        <p className="text-muted mt-1 text-sm">
          {INQUIRY_STATUS_LABELS[inquiry.status]} ·{" "}
          {formatDateTime(inquiry.createdAt)}
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="border-line rounded-lg border px-3 py-2.5">
          <p className="text-muted text-xs">작성자</p>
          <p className="text-pine-900 mt-1 text-sm font-medium">
            <Link
              href={`/admin/members/${inquiry.userId}`}
              className="underline-offset-4 hover:underline"
            >
              {inquiry.authorNickname}
            </Link>
          </p>
          <p className="text-muted mt-0.5 text-xs">
            {inquiry.authorEmail ?? "이메일 없음"}
          </p>
        </div>
        <div className="border-line rounded-lg border px-3 py-2.5">
          <p className="text-muted text-xs">답변 시각</p>
          <p className="text-pine-900 mt-1 text-sm font-medium">
            {inquiry.answeredAt ? formatDateTime(inquiry.answeredAt) : "—"}
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-pine-900 text-base font-semibold">문의 본문</h3>
        <p className="text-muted mt-3 whitespace-pre-wrap text-sm leading-7">
          {inquiry.content}
        </p>
      </section>

      <section>
        <h3 className="text-pine-900 mb-3 text-base font-semibold">답변</h3>
        <AdminAnswerInquiryForm
          inquiryId={inquiry.id}
          defaultAnswer={inquiry.answerContent}
        />
      </section>
    </div>
  );
}
