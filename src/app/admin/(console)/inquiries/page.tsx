import Link from "next/link";
import { withAdminPermission } from "@/features/admin/admin-db";
import { INQUIRY_STATUS_LABELS } from "@/features/inquiries/status";
import {
  listAdminInquiries,
  parseInquiryStatusFilter,
} from "@/features/inquiries/queries";
import type { InquiryStatus } from "@/features/inquiries/types";

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

const FILTERS: Array<{ value: "ALL" | InquiryStatus; label: string }> = [
  { value: "ALL", label: "전체" },
  { value: "OPEN", label: "답변 대기" },
  { value: "ANSWERED", label: "답변 완료" },
  { value: "CLOSED", label: "종료" },
];

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { db } = await withAdminPermission("inquiries");
  const params = await searchParams;
  const status = parseInquiryStatusFilter(params.status);
  const inquiries = await listAdminInquiries(db, status);

  return (
    <div className="animate-rise flex flex-col gap-6">
      <div>
        <h2 className="text-pine-900 text-xl font-semibold">문의 관리</h2>
        <p className="text-muted mt-1 text-sm">
          상태별로 문의를 확인하고 답변할 수 있어요.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const active = status === filter.value;
          const href =
            filter.value === "ALL"
              ? "/admin/inquiries"
              : `/admin/inquiries?status=${filter.value}`;
          return (
            <Link
              key={filter.value}
              href={href}
              className={
                active
                  ? "bg-pine-800 text-fog-50 rounded-lg px-3 py-2 text-sm font-medium"
                  : "border-line text-pine-800 hover:bg-fog-100 rounded-lg border px-3 py-2 text-sm font-medium"
              }
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      <div className="border-line overflow-x-auto rounded-lg border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-fog-100 text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">제목</th>
              <th className="px-3 py-2 font-medium">작성자</th>
              <th className="px-3 py-2 font-medium">상태</th>
              <th className="px-3 py-2 font-medium">작성일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-line)]">
            {inquiries.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-muted px-3 py-4">
                  문의가 없어요.
                </td>
              </tr>
            ) : (
              inquiries.map((inquiry) => (
                <tr key={inquiry.id} className="hover:bg-fog-100/60">
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/admin/inquiries/${inquiry.id}`}
                      className="text-pine-800 font-medium underline-offset-4 hover:underline"
                    >
                      {inquiry.title}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/admin/members/${inquiry.userId}`}
                      className="text-pine-800 underline-offset-4 hover:underline"
                    >
                      {inquiry.authorNickname}
                    </Link>
                    <p className="text-muted text-xs">
                      {inquiry.authorEmail ?? "—"}
                    </p>
                  </td>
                  <td className="px-3 py-2.5">
                    {INQUIRY_STATUS_LABELS[inquiry.status]}
                  </td>
                  <td className="px-3 py-2.5">
                    {formatDateTime(inquiry.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
