import type { ActionResult } from "@/features/auth/actions";

export function AuthMessage({ result }: { result: ActionResult | null }) {
  if (!result?.message) {
    return null;
  }

  return (
    <p
      role={result.ok ? "status" : "alert"}
      className={
        result.ok
          ? "text-pine-700 bg-pine-50 border-pine-200 rounded-lg border px-3 py-2 text-sm"
          : "border-dawn-300 bg-dawn-50 text-dawn-900 rounded-lg border px-3 py-2 text-sm"
      }
    >
      {result.message}
    </p>
  );
}
