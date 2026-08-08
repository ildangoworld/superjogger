"use client";

import { useActionState, useState } from "react";
import type { ActionResult } from "@/features/auth/actions";
import { AuthMessage } from "@/features/auth/components/auth-message";
import { ADMIN_PERMISSION_KEYS } from "@/features/admin/permissions";
import type { AdminPermissionKey } from "@/features/admin/types";
import {
  addAdminUser,
  removeAdminUser,
  updateAdminUser,
} from "@/features/settings/actions";
import type { ManagedAdminUser } from "@/features/settings/admins";

const initial: ActionResult = { ok: false };

const PERMISSION_LABELS: Record<AdminPermissionKey, string> = {
  dashboard: "대시보드",
  members: "회원 관리",
  crews: "크루 관리",
  inquiries: "문의 관리",
  legal: "콘텐츠 관리",
  settings: "설정",
};

export function AdminAddAdminForm() {
  const [state, action, pending] = useActionState(addAdminUser, initial);
  const [role, setRole] = useState<"SUPER" | "STAFF">("STAFF");

  return (
    <form action={action} className="border-line flex flex-col gap-3 rounded-lg border p-4">
      <h3 className="text-pine-900 text-sm font-semibold">관리자 추가</h3>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-pine-900 font-medium">회원 이메일</span>
        <input
          name="email"
          type="email"
          required
          className="border-line bg-fog-50 focus:border-pine-500 h-11 rounded-lg border px-3 outline-none"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-pine-900 font-medium">역할</span>
        <select
          name="role"
          value={role}
          onChange={(event) =>
            setRole(event.target.value as "SUPER" | "STAFF")
          }
          className="border-line bg-fog-50 focus:border-pine-500 h-11 rounded-lg border px-3 outline-none"
        >
          <option value="STAFF">STAFF</option>
          <option value="SUPER">SUPER</option>
        </select>
      </label>
      {role === "STAFF" ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-pine-900 text-sm font-medium">메뉴 권한</legend>
          {ADMIN_PERMISSION_KEYS.map((key) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="permissions" value={key} />
              {PERMISSION_LABELS[key]}
            </label>
          ))}
        </fieldset>
      ) : (
        <p className="text-muted text-xs">
          SUPER는 모든 메뉴에 접근하며 권한 배열과 무관해요.
        </p>
      )}
      <AuthMessage result={state.ok || state.message ? state : null} />
      <button
        type="submit"
        disabled={pending}
        className="bg-pine-800 text-fog-50 hover:bg-pine-700 h-11 w-fit rounded-lg px-4 text-sm font-semibold disabled:opacity-60"
      >
        {pending ? "추가 중" : "관리자 추가"}
      </button>
    </form>
  );
}

export function AdminUpdateAdminForm({
  admin,
}: {
  admin: ManagedAdminUser;
}) {
  const [state, action, pending] = useActionState(updateAdminUser, initial);
  const [role, setRole] = useState(admin.role);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="userId" value={admin.userId} />
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-pine-900 font-medium">역할</span>
        <select
          name="role"
          value={role}
          onChange={(event) =>
            setRole(event.target.value as "SUPER" | "STAFF")
          }
          className="border-line bg-fog-50 focus:border-pine-500 h-11 rounded-lg border px-3 outline-none"
        >
          <option value="STAFF">STAFF</option>
          <option value="SUPER">SUPER</option>
        </select>
      </label>
      {role === "STAFF" ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-pine-900 text-sm font-medium">메뉴 권한</legend>
          {ADMIN_PERMISSION_KEYS.map((key) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="permissions"
                value={key}
                defaultChecked={admin.permissions.includes(key)}
              />
              {PERMISSION_LABELS[key]}
            </label>
          ))}
        </fieldset>
      ) : null}
      <AuthMessage result={state.ok || state.message ? state : null} />
      <button
        type="submit"
        disabled={pending}
        className="bg-pine-800 text-fog-50 hover:bg-pine-700 h-10 w-fit rounded-lg px-3 text-sm font-semibold disabled:opacity-60"
      >
        {pending ? "저장 중" : "권한 저장"}
      </button>
    </form>
  );
}

export function AdminRemoveAdminForm({
  userId,
  email,
}: {
  userId: string;
  email: string | null;
}) {
  const [state, action, pending] = useActionState(removeAdminUser, initial);

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="userId" value={userId} />
      <AuthMessage result={state.ok || state.message ? state : null} />
      <button
        type="submit"
        disabled={pending}
        className="bg-dawn-700 text-fog-50 hover:bg-dawn-600 h-10 w-fit rounded-lg px-3 text-sm font-semibold disabled:opacity-60"
      >
        {pending ? "해제 중" : `${email ?? "관리자"} 권한 해제`}
      </button>
    </form>
  );
}
