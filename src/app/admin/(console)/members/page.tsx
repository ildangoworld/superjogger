import Link from "next/link";
import { withAdminPermission } from "@/features/admin/admin-db";
import { listAdminMembers } from "@/features/admin/members";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "medium",
  }).format(new Date(iso));
}

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { db } = await withAdminPermission("members");
  const params = await searchParams;
  const q = params.q ?? "";
  const members = await listAdminMembers(db, q);

  return (
    <div className="animate-rise flex flex-col gap-6">
      <div>
        <h2 className="text-pine-900 text-xl font-semibold">회원 관리</h2>
        <p className="text-muted mt-1 text-sm">
          닉네임·이메일로 검색할 수 있어요.
        </p>
      </div>

      <form className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          name="q"
          defaultValue={q}
          placeholder="닉네임 또는 이메일"
          className="border-line bg-fog-50 focus:border-pine-500 h-11 w-full max-w-md rounded-lg border px-3 text-sm outline-none"
        />
        <button
          type="submit"
          className="bg-pine-800 text-fog-50 hover:bg-pine-700 h-11 rounded-lg px-4 text-sm font-semibold"
        >
          검색
        </button>
      </form>

      <div className="border-line overflow-x-auto rounded-lg border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-fog-100 text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">닉네임</th>
              <th className="px-3 py-2 font-medium">이메일</th>
              <th className="px-3 py-2 font-medium">가입일</th>
              <th className="px-3 py-2 font-medium">온보딩</th>
              <th className="px-3 py-2 font-medium">마지막 운동</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-line)]">
            {members.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted px-3 py-4">
                  검색 결과가 없어요.
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.id} className="hover:bg-fog-100/60">
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/admin/members/${member.id}`}
                      className="text-pine-800 font-medium underline-offset-4 hover:underline"
                    >
                      {member.nickname}
                    </Link>
                  </td>
                  <td className="text-muted px-3 py-2.5">
                    {member.email ?? "—"}
                  </td>
                  <td className="px-3 py-2.5">{formatDate(member.createdAt)}</td>
                  <td className="px-3 py-2.5">
                    {member.onboardingCompleted ? "완료" : "미완료"}
                  </td>
                  <td className="px-3 py-2.5">
                    {member.lastWorkoutDate ?? "—"}
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
