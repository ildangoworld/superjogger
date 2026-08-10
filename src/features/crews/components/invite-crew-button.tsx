"use client";

import { useState } from "react";

export function InviteCrewButton({ inviteCode }: { inviteCode: string }) {
  const [copied, setCopied] = useState(false);

  async function copyInviteUrl() {
    const url = `${window.location.origin}/crews/join/${inviteCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("초대 링크를 복사해 주세요.", url);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copyInviteUrl()}
      className="border-line text-pine-800 hover:bg-pine-50 h-11 rounded-lg border px-4 text-sm font-medium"
    >
      {copied ? "링크를 복사했어요" : "초대하기"}
    </button>
  );
}
