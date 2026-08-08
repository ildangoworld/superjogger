import Link from "next/link";
import { CreateInquiryForm } from "@/features/inquiries/components/create-inquiry-form";
import { INQUIRY_STATUS_LABELS } from "@/features/inquiries/status";
import type { Inquiry } from "@/features/inquiries/types";

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function ProfileInquiriesSection({
  inquiries,
}: {
  inquiries: Inquiry[];
}) {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="text-pine-900 text-lg font-semibold">문의하기</h2>
        <p className="text-muted mt-1 text-sm leading-6">
          서비스 이용 중 궁금한 점을 남겨 주세요. 답변이 오면 여기서 확인할 수
          있어요.
        </p>
      </div>

      <CreateInquiryForm />

      <div>
        <h3 className="text-pine-900 text-base font-semibold">내 문의</h3>
        {inquiries.length === 0 ? (
          <p className="text-muted mt-2 text-sm">아직 등록한 문의가 없어요.</p>
        ) : (
          <ul className="border-line mt-3 divide-y rounded-lg border">
            {inquiries.map((inquiry) => (
              <li key={inquiry.id}>
                <Link
                  href={`/profile/inquiries/${inquiry.id}`}
                  className="hover:bg-fog-100/60 flex flex-col gap-1 px-4 py-3"
                >
                  <span className="text-pine-900 text-sm font-medium">
                    {inquiry.title}
                  </span>
                  <span className="text-muted text-xs">
                    {INQUIRY_STATUS_LABELS[inquiry.status]} ·{" "}
                    {formatDateTime(inquiry.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
