import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { INQUIRY_STATUS_LABELS } from "@/features/inquiries/status";
import { getMyInquiry } from "@/features/inquiries/queries";
import { createClient } from "@/lib/supabase/server";

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default async function ProfileInquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const inquiry = await getMyInquiry(supabase, user.id, id);
  if (!inquiry) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8 pt-6 pb-8">
      <div>
        <Link
          href="/profile"
          className="text-pine-700 text-sm underline-offset-4 hover:underline"
        >
          ← 프로필
        </Link>
        <h1 className="text-pine-900 mt-3 text-2xl font-semibold">
          {inquiry.title}
        </h1>
        <p className="text-muted mt-2 text-sm">
          {INQUIRY_STATUS_LABELS[inquiry.status]} ·{" "}
          {formatDateTime(inquiry.createdAt)}
        </p>
      </div>

      <section>
        <h2 className="text-pine-900 text-base font-semibold">문의 내용</h2>
        <p className="text-muted mt-3 whitespace-pre-wrap text-sm leading-7">
          {inquiry.content}
        </p>
      </section>

      <section>
        <h2 className="text-pine-900 text-base font-semibold">답변</h2>
        {inquiry.answerContent ? (
          <>
            <p className="text-muted mt-3 whitespace-pre-wrap text-sm leading-7">
              {inquiry.answerContent}
            </p>
            {inquiry.answeredAt ? (
              <p className="text-muted mt-2 text-xs">
                {formatDateTime(inquiry.answeredAt)}
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-muted mt-3 text-sm leading-7">
            아직 답변이 없어요. 확인되는 대로 답변드릴게요.
          </p>
        )}
      </section>
    </div>
  );
}
