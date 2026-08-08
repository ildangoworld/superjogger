import Link from "next/link";
import { notFound } from "next/navigation";
import { withAdminPermission } from "@/features/admin/admin-db";
import { AdminDeleteMemberForm } from "@/features/admin/components/admin-delete-member-form";
import { getAdminMemberDetail } from "@/features/admin/members";

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default async function AdminMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { db } = await withAdminPermission("members");
  const member = await getAdminMemberDetail(db, id);

  if (!member) {
    notFound();
  }

  return (
    <div className="animate-rise flex max-w-3xl flex-col gap-8">
      <div>
        <Link
          href="/admin/members"
          className="text-pine-700 text-sm underline-offset-4 hover:underline"
        >
          ← 회원 목록
        </Link>
        <h2 className="text-pine-900 mt-3 text-xl font-semibold">
          {member.nickname}
        </h2>
        <p className="text-muted mt-1 text-sm">{member.email ?? "이메일 없음"}</p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2">
        <Info label="가입일" value={formatDateTime(member.createdAt)} />
        <Info
          label="온보딩"
          value={member.onboardingCompleted ? "완료" : "미완료"}
        />
        <Info label="타임존" value={member.timezone} />
        <Info
          label="AI 추천 상세도"
          value={member.recommendationDetail === "DETAILED" ? "자세히" : "간단히"}
        />
        <Info
          label="조거 등급"
          value={`${member.gradeLabel}${member.gradeProvisional ? " (임시)" : ""}`}
        />
        <Info label="누적 기록" value={`${member.workoutCount}회`} />
        <Info
          label="AI 사용(오늘)"
          value={`${member.aiUsageToday} / ${member.dailyAnalysisLimit}`}
        />
        <Info label="AI 사용(누적 성공)" value={`${member.aiUsageTotal}회`} />
      </section>

      <section>
        <h3 className="text-pine-900 text-base font-semibold">이번 주 목표</h3>
        {member.currentGoal ? (
          <p className="text-muted mt-2 text-sm">
            {member.currentGoal.weekStart} 주 ·{" "}
            {member.currentGoal.qualifiedDayCount} /{" "}
            {member.currentGoal.targetCount}일
          </p>
        ) : (
          <p className="text-muted mt-2 text-sm">이번 주 목표가 없어요.</p>
        )}
      </section>

      <section>
        <h3 className="text-pine-900 text-base font-semibold">가입 크루</h3>
        {member.crews.length === 0 ? (
          <p className="text-muted mt-2 text-sm">가입한 크루가 없어요.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {member.crews.map((crew) => (
              <li key={crew.id}>
                <Link
                  href={`/admin/crews/${crew.id}`}
                  className="text-pine-800 text-sm font-medium underline-offset-4 hover:underline"
                >
                  {crew.name}
                </Link>
                <span className="text-muted ml-2 text-xs">
                  {crew.role === "OWNER" ? "소유자" : "멤버"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="text-pine-900 text-base font-semibold">동의 기록</h3>
        {member.consents.length === 0 ? (
          <p className="text-muted mt-2 text-sm">동의 기록이 없어요.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {member.consents.map((consent) => (
              <li
                key={`${consent.docType}-${consent.version}-${consent.consentedAt}`}
                className="text-muted text-sm"
              >
                {consent.docType === "TERMS"
                  ? "이용약관"
                  : "개인정보처리방침"}{" "}
                v{consent.version} · {formatDateTime(consent.consentedAt)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="text-pine-900 mb-3 text-base font-semibold">계정 조치</h3>
        <AdminDeleteMemberForm
          userId={member.id}
          nickname={member.nickname}
        />
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-line rounded-lg border px-3 py-2.5">
      <p className="text-muted text-xs">{label}</p>
      <p className="text-pine-900 mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
