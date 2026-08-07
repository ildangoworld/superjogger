import Link from "next/link";
import { withAdminPermission } from "@/features/admin/admin-db";
import { listAdminCrews } from "@/features/admin/crews";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "medium",
  }).format(new Date(iso));
}

export default async function AdminCrewsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { db } = await withAdminPermission("crews");
  const params = await searchParams;
  const q = params.q ?? "";
  const crews = await listAdminCrews(db, q);

  return (
    <div className="animate-rise flex flex-col gap-6">
      <div>
        <h2 className="text-pine-900 text-xl font-semibold">크루 관리</h2>
        <p className="text-muted mt-1 text-sm">크루 이름으로 검색할 수 있어요.</p>
      </div>

      <form className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          name="q"
          defaultValue={q}
          placeholder="크루 이름"
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
              <th className="px-3 py-2 font-medium">이름</th>
              <th className="px-3 py-2 font-medium">소유자</th>
              <th className="px-3 py-2 font-medium">멤버</th>
              <th className="px-3 py-2 font-medium">생성일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-line)]">
            {crews.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-muted px-3 py-4">
                  검색 결과가 없어요.
                </td>
              </tr>
            ) : (
              crews.map((crew) => (
                <tr key={crew.id} className="hover:bg-fog-100/60">
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/admin/crews/${crew.id}`}
                      className="text-pine-800 font-medium underline-offset-4 hover:underline"
                    >
                      {crew.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5">{crew.ownerNickname}</td>
                  <td className="px-3 py-2.5">{crew.memberCount}</td>
                  <td className="px-3 py-2.5">{formatDate(crew.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
