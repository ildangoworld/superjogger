import Link from "next/link";
import { requireAdminPermission } from "@/features/admin/auth";
import { AdminAiPromptSettingsForm } from "@/features/settings/components/admin-ai-prompt-settings-form";
import { loadAiPromptSettings } from "@/features/settings/queries";
import { createServiceRoleClient } from "@/lib/supabase/server";

export default async function AdminAiPromptSettingsPage() {
  await requireAdminPermission("settings");
  const settings = await loadAiPromptSettings(createServiceRoleClient());

  return (
    <section className="animate-rise flex flex-col gap-6">
      <div>
        <Link
          href="/admin/settings"
          className="text-pine-700 text-sm underline-offset-4 hover:underline"
        >
          ← 설정
        </Link>
        <h2 className="text-pine-900 mt-3 text-xl font-semibold">AI 프롬프트</h2>
        <p className="text-muted mt-2 text-sm">
          운동 분석 GPT 요청에 쓰는 시스템·사용자 프롬프트를 관리해요. 강도·컨디션은
          한글 표현 기준으로 맞춰 주세요.
        </p>
      </div>
      <AdminAiPromptSettingsForm settings={settings} />
    </section>
  );
}
