import Link from "next/link";
import { redirect } from "next/navigation";
import { withAdminPermission } from "@/features/admin/admin-db";
import { getDashboardMetrics } from "@/features/admin/dashboard";
import { ADMIN_MENU_ITEMS } from "@/features/admin/menu";
import {
  filterAdminMenuItems,
  hasAdminPermission,
} from "@/features/admin/permissions";
import { requireAdmin } from "@/features/admin/auth";

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="border-line bg-fog-100/80 rounded-lg border px-4 py-3">
      <p className="text-muted text-xs">{label}</p>
      <p className="text-pine-900 mt-1 text-2xl font-semibold tabular-nums">
        {value}
      </p>
      {hint ? <p className="text-muted mt-1 text-xs">{hint}</p> : null}
    </div>
  );
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();

  if (!hasAdminPermission(admin, "dashboard")) {
    const visible = filterAdminMenuItems(admin, ADMIN_MENU_ITEMS).filter(
      (item) => item.key !== "dashboard",
    );
    redirect(visible[0]?.href ?? "/admin/settings/account");
  }

  const { db } = await withAdminPermission("dashboard");
  const metrics = await getDashboardMetrics(db);

  return (
    <div className="animate-rise flex flex-col gap-8">
      <section>
        <h2 className="text-pine-900 text-xl font-semibold">지표 요약</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard label="총 회원" value={metrics.totalMembers} />
          <MetricCard
            label="오늘 신규 가입"
            value={metrics.newMembersToday}
          />
          <MetricCard
            label="최근 7일 신규 가입"
            value={metrics.newMembersLast7Days}
          />
          <MetricCard
            label="오늘 운동 기록"
            value={metrics.workoutsToday}
            hint="운동 일자(로컬) 기준 · Asia/Seoul"
          />
          <MetricCard
            label="최근 7일 기록 사용자"
            value={metrics.activeWritersLast7Days}
          />
        </div>
      </section>

      <section>
        <h2 className="text-pine-900 text-xl font-semibold">AI 사용 현황</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            label="오늘 분석 성공"
            value={metrics.aiSuccessToday}
          />
          <MetricCard
            label="오늘 분석 실패"
            value={metrics.aiFailedToday}
            hint="슬롯 RELEASED"
          />
          <MetricCard
            label="오늘 한도 도달"
            value={metrics.aiLimitReachedToday}
            hint={`일일 ${metrics.dailyAnalysisLimit}회`}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-pine-900 text-lg font-semibold">
              최근 가입 회원
            </h2>
            {hasAdminPermission(admin, "members") ? (
              <Link
                href="/admin/members"
                className="text-pine-700 text-sm underline-offset-4 hover:underline"
              >
                전체 보기
              </Link>
            ) : null}
          </div>
          <ul className="border-line mt-3 divide-y rounded-lg border">
            {metrics.recentMembers.length === 0 ? (
              <li className="text-muted px-4 py-3 text-sm">아직 회원이 없어요.</li>
            ) : (
              metrics.recentMembers.map((member) => (
                <li key={member.id} className="px-4 py-3">
                  {hasAdminPermission(admin, "members") ? (
                    <Link
                      href={`/admin/members/${member.id}`}
                      className="text-pine-900 hover:text-pine-600 font-medium"
                    >
                      {member.nickname}
                    </Link>
                  ) : (
                    <span className="text-pine-900 font-medium">
                      {member.nickname}
                    </span>
                  )}
                  <p className="text-muted mt-0.5 text-xs">
                    {formatDateTime(member.createdAt)}
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-pine-900 text-lg font-semibold">최근 문의</h2>
            <Link
              href="/admin/inquiries"
              className="text-pine-700 text-sm underline-offset-4 hover:underline"
            >
              문의 관리
            </Link>
          </div>
          <div className="border-line text-muted mt-3 rounded-lg border px-4 py-3 text-sm">
            문의하기는 Phase A4에서 연결됩니다.
          </div>
        </div>
      </section>
    </div>
  );
}
