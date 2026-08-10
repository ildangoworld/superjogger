import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateCrewEntryButton } from "@/features/crews/components/crew-forms";
import { listMyCrews, listPublicCrews } from "@/features/crews/service";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "크루" };

export default async function CrewsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let myCrews;
  let publicCrews;
  try {
    [myCrews, publicCrews] = await Promise.all([
      listMyCrews(supabase, user.id),
      listPublicCrews(supabase),
    ]);
  } catch (error) {
    return (
      <div className="flex flex-col gap-3 pt-6">
        <p className="text-muted text-sm">
          크루 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
        </p>
        <p className="text-dawn-900 text-sm leading-6">
          {error instanceof Error ? error.message : "알 수 없는 오류"}
        </p>
      </div>
    );
  }

  const discoverable = publicCrews.filter((crew) => !crew.isMember);

  return (
    <div className="flex flex-col gap-10 pt-6 pb-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-pine-900 text-2xl font-semibold">크루</h1>
          <p className="text-muted mt-2 text-sm leading-6">
            함께 달리는 사람들을 찾고, 주간 목표를 가볍게 나눠요.
          </p>
        </div>
        <CreateCrewEntryButton />
      </div>

      <section>
        <h2 className="text-pine-900 text-lg font-semibold">내 크루</h2>
        {myCrews.length === 0 ? (
          <p className="text-muted mt-3 text-sm leading-6">
            아직 가입한 크루가 없어요. 만들거나 공개 크루에 신청해 보세요.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {myCrews.map((crew) => (
              <li key={crew.id}>
                <Link
                  href={`/crews/${crew.id}`}
                  className="border-line hover:border-pine-300 block rounded-lg border px-4 py-4 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-pine-900 font-semibold">{crew.name}</p>
                    <p className="text-muted text-xs">
                      {crew.isPublic ? "공개" : "비공개"}
                    </p>
                  </div>
                  {crew.description ? (
                    <p className="text-muted mt-2 line-clamp-2 text-sm leading-6">
                      {crew.description}
                    </p>
                  ) : null}
                  <p className="text-pine-700 mt-2 text-xs font-medium">
                    멤버 {crew.memberCount}명
                    {crew.role === "OWNER" ? " · 리더" : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border-line border-t pt-10">
        <h2 className="text-pine-900 text-lg font-semibold">공개 크루 탐색</h2>
        <p className="text-muted mt-1 text-sm leading-6">
          소개를 보고 가입을 신청하면 리더가 승인해요.
        </p>
        {discoverable.length === 0 ? (
          <p className="text-muted mt-4 text-sm leading-6">
            지금 신청할 수 있는 공개 크루가 없어요.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {discoverable.map((crew) => (
              <li key={crew.id}>
                <Link
                  href={`/crews/${crew.id}`}
                  className="border-line hover:border-pine-300 block rounded-lg border px-4 py-4 transition-colors"
                >
                  <p className="text-pine-900 font-semibold">{crew.name}</p>
                  {crew.description ? (
                    <p className="text-muted mt-2 line-clamp-2 text-sm leading-6">
                      {crew.description}
                    </p>
                  ) : null}
                  <p className="text-pine-700 mt-2 text-xs font-medium">
                    멤버 {crew.memberCount}명
                    {crew.pendingRequest ? " · 신청 대기 중" : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
