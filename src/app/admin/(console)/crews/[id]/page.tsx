import Link from "next/link";
import { notFound } from "next/navigation";
import { withAdminPermission } from "@/features/admin/admin-db";
import {
  AdminDeleteCrewForm,
  AdminReissueInviteForm,
} from "@/features/admin/components/admin-crew-actions";
import { getAdminCrewDetail } from "@/features/admin/crews";

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default async function AdminCrewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { db } = await withAdminPermission("crews");
  const crew = await getAdminCrewDetail(db, id);

  if (!crew) {
    notFound();
  }

  return (
    <div className="animate-rise flex max-w-3xl flex-col gap-8">
      <div>
        <Link
          href="/admin/crews"
          className="text-pine-700 text-sm underline-offset-4 hover:underline"
        >
          ← 크루 목록
        </Link>
        <h2 className="text-pine-900 mt-3 text-xl font-semibold">{crew.name}</h2>
        {crew.description ? (
          <p className="text-muted mt-1 text-sm">{crew.description}</p>
        ) : null}
      </div>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="border-line rounded-lg border px-3 py-2.5">
          <p className="text-muted text-xs">소유자</p>
          <p className="text-pine-900 mt-1 text-sm font-medium">
            <Link
              href={`/admin/members/${crew.ownerId}`}
              className="underline-offset-4 hover:underline"
            >
              {crew.ownerNickname}
            </Link>
          </p>
        </div>
        <div className="border-line rounded-lg border px-3 py-2.5">
          <p className="text-muted text-xs">생성일</p>
          <p className="text-pine-900 mt-1 text-sm font-medium">
            {formatDateTime(crew.createdAt)}
          </p>
        </div>
        <div className="border-line rounded-lg border px-3 py-2.5 sm:col-span-2">
          <p className="text-muted text-xs">초대 코드</p>
          <p className="text-pine-900 mt-1 font-mono text-sm font-semibold tracking-wide">
            {crew.inviteCode}
          </p>
          <div className="mt-3">
            <AdminReissueInviteForm crewId={crew.id} />
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-pine-900 text-base font-semibold">멤버</h3>
        <ul className="border-line mt-3 divide-y rounded-lg border">
          {crew.members.map((member) => (
            <li
              key={member.userId}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
            >
              <div>
                <Link
                  href={`/admin/members/${member.userId}`}
                  className="text-pine-800 text-sm font-medium underline-offset-4 hover:underline"
                >
                  {member.nickname}
                </Link>
                <p className="text-muted text-xs">
                  {member.role === "OWNER" ? "소유자" : "멤버"} ·{" "}
                  {formatDateTime(member.joinedAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-pine-900 mb-3 text-base font-semibold">운영 조치</h3>
        <AdminDeleteCrewForm crewId={crew.id} name={crew.name} />
      </section>
    </div>
  );
}
