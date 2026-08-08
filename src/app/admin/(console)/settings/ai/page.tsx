import Link from "next/link";
import { requireAdminPermission } from "@/features/admin/auth";
import { AdminAiSettingsForm } from "@/features/settings/components/admin-ai-settings-form";
import { loadAiAppSettings } from "@/features/settings/queries";
import { createServiceRoleClient } from "@/lib/supabase/server";

export default async function AdminAiSettingsPage() {
  await requireAdminPermission("settings");
  const settings = await loadAiAppSettings(createServiceRoleClient());

  return (
    <section className="animate-rise flex flex-col gap-6">
      <div>
        <Link
          href="/admin/settings"
          className="text-pine-700 text-sm underline-offset-4 hover:underline"
        >
          ← 설정
        </Link>
        <h2 className="text-pine-900 mt-3 text-xl font-semibold">AI 설정</h2>
        <p className="text-muted mt-2 text-sm">
          모델·일일 한도·Base URL을 관리해요. 저장 즉시 분석 한도에 반영돼요.
        </p>
      </div>
      <AdminAiSettingsForm
        settings={settings}
        envModel={process.env.AI_MODEL ?? ""}
        envBaseUrl={process.env.AI_BASE_URL ?? ""}
      />
    </section>
  );
}
