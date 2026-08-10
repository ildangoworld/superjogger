import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { StickyBackBar } from "@/components/layout/sticky-back-bar";
import { RequestJoinCrewForm } from "@/features/crews/components/crew-forms";
import { getCrewPreviewByInviteCode } from "@/features/crews/service";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "크루 초대" };

export default async function CrewInviteJoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const preview = await getCrewPreviewByInviteCode(supabase, code);
  if (!preview) {
    notFound();
  }

  if (preview.isMember) {
    redirect(`/crews/${preview.id}`);
  }

  return (
    <div className="pb-8">
      <StickyBackBar fallbackHref="/crews" />
      <section className="mt-5 flex flex-col gap-6">
        <div>
          <h1 className="text-pine-900 text-2xl font-semibold">{preview.name}</h1>
          <p className="text-muted mt-2 text-xs font-medium">
            {preview.isPublic ? "공개 크루" : "비공개 크루"} · 초대 링크
          </p>
          {preview.description ? (
            <p className="text-muted mt-3 text-sm leading-6">
              {preview.description}
            </p>
          ) : null}
          <p className="text-muted mt-3 text-sm">멤버 {preview.memberCount}명</p>
        </div>

        {preview.pendingRequest ? (
          <p className="border-pine-200 bg-pine-50 text-pine-800 rounded-lg border px-3 py-3 text-sm leading-6">
            가입 신청을 보내 두었어요. 리더가 확인할 때까지 기다려 주세요.
          </p>
        ) : (
          <div>
            <h2 className="text-pine-900 text-base font-semibold">가입 신청</h2>
            <p className="text-muted mt-1 text-sm leading-6">
              초대 링크로 들어왔어요. 소개를 남기고 신청해 주세요.
            </p>
            <div className="mt-4">
              <RequestJoinCrewForm
                crewId={preview.id}
                inviteCode={code.toUpperCase()}
              />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
