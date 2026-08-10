import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { StickyBackBar } from "@/components/layout/sticky-back-bar";
import { CrewBoard } from "@/features/crews/components/crew-board";
import { RequestJoinCrewForm } from "@/features/crews/components/crew-forms";
import {
  getCrewBoard,
  getCrewPreviewById,
  listCrewJoinRequests,
  listMyCrews,
} from "@/features/crews/service";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "크루 상세" };

export default async function CrewDetailPage({
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .maybeSingle();
  const timezone = profile?.timezone ?? "Asia/Seoul";

  const myCrews = await listMyCrews(supabase, user.id);
  const membership = myCrews.find((crew) => crew.id === id) ?? null;

  if (membership) {
    let board;
    try {
      board = await getCrewBoard(supabase, user.id, membership.id, timezone);
    } catch {
      return (
        <div className="pb-8">
          <StickyBackBar fallbackHref="/crews" />
          <p className="text-muted mt-6 text-sm">
            크루 현황을 불러오지 못했어요.
          </p>
        </div>
      );
    }

    const joinRequests =
      membership.ownerId === user.id
        ? await listCrewJoinRequests(supabase, membership.id)
        : [];

    return (
      <div className="pb-8">
        <StickyBackBar fallbackHref="/crews" />
        <div className="mt-5">
          <CrewBoard
            crew={membership}
            weekStart={board.weekStart}
            members={board.members}
            isOwner={membership.ownerId === user.id}
            joinRequests={joinRequests}
          />
        </div>
      </div>
    );
  }

  const preview = await getCrewPreviewById(supabase, id);
  if (!preview || !preview.isPublic) {
    notFound();
  }

  return (
    <div className="pb-8">
      <StickyBackBar fallbackHref="/crews" />
      <section className="mt-5 flex flex-col gap-6">
        <div>
          <h1 className="text-pine-900 text-2xl font-semibold">{preview.name}</h1>
          <p className="text-muted mt-2 text-xs font-medium">공개 크루</p>
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
              짧은 소개를 남기면 리더가 보고 승인해요.
            </p>
            <div className="mt-4">
              <RequestJoinCrewForm crewId={preview.id} />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
