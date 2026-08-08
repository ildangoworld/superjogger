import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CrewBoard, CrewSwitcher } from "@/features/crews/components/crew-board";
import { CrewEntryActions } from "@/features/crews/components/crew-forms";
import { getCrewBoard, listMyCrews } from "@/features/crews/service";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "크루 현황" };

export default async function CrewsPage({
  searchParams,
}: {
  searchParams: Promise<{ crew?: string }>;
}) {
  const params = await searchParams;
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

  let crews;
  let crewsErrorMessage: string | null = null;
  try {
    crews = await listMyCrews(supabase, user.id);
  } catch (error) {
    crewsErrorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류";
    return (
      <div className="flex flex-col gap-3 pt-6">
        <p className="text-muted text-sm">
          크루 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
        </p>
        <p className="text-dawn-900 text-sm leading-6">
          {crewsErrorMessage}
          <br />
          `20260807040000_phase5_crews.sql` 마이그레이션이 적용됐는지 확인해
          주세요.
        </p>
      </div>
    );
  }

  const selectedCrewId =
    params.crew && crews.some((crew) => crew.id === params.crew)
      ? params.crew
      : (crews[0]?.id ?? null);

  const selectedCrew = selectedCrewId
    ? crews.find((crew) => crew.id === selectedCrewId) ?? null
    : null;

  let board: Awaited<ReturnType<typeof getCrewBoard>> | null = null;
  if (selectedCrew) {
    try {
      board = await getCrewBoard(
        supabase,
        user.id,
        selectedCrew.id,
        timezone,
      );
    } catch {
      board = null;
    }
  }

  return (
    <div className="flex flex-col gap-10 pt-6 pb-8">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-pine-900 text-2xl font-semibold">크루 현황</h1>
          <p className="text-muted mt-2 text-sm leading-6">
            순위 없이, 서로의 주간 목표 진행만 가볍게 확인해요.
          </p>
        </div>
        <CrewEntryActions />
      </div>

      {crews.length > 0 ? (
        <CrewSwitcher crews={crews} selectedCrewId={selectedCrew!.id} />
      ) : null}

      {selectedCrew && board ? (
        <CrewBoard
          crew={selectedCrew}
          weekStart={board.weekStart}
          members={board.members}
          isOwner={selectedCrew.ownerId === user.id}
        />
      ) : selectedCrew ? (
        <p className="text-muted text-sm">
          크루 현황을 불러오지 못했어요. 마이그레이션 적용 여부를 확인해 주세요.
        </p>
      ) : (
        <p className="text-muted text-sm leading-6">
          아직 가입한 크루가 없어요. 만들거나 초대 코드로 참여해 보세요.
        </p>
      )}
    </div>
  );
}
