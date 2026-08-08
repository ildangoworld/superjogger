"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  startTransition,
  useActionState,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import {
  updateAvatar,
  updateProfileSettings,
  type ActionResult,
} from "@/features/auth/actions";
import { compressAvatarFile } from "@/features/auth/avatar-compress";
import { AuthMessage } from "@/features/auth/components/auth-message";
import { Modal } from "@/components/layout/modal";

type Props = {
  nickname: string;
  email: string | undefined;
  avatarUrl: string | null;
};

const initial: ActionResult = { ok: false };

function AvatarPreview({
  nickname,
  avatarUrl,
  sizeClass,
  textClass,
}: {
  nickname: string;
  avatarUrl: string | null;
  sizeClass: string;
  textClass: string;
}) {
  if (avatarUrl?.startsWith("blob:")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- blob preview before upload
      <img
        src={avatarUrl}
        alt=""
        className={`${sizeClass} shrink-0 rounded-full object-cover`}
      />
    );
  }

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={`${nickname} 프로필 사진`}
        width={64}
        height={64}
        className={`${sizeClass} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      aria-hidden
      className={`bg-pine-100 text-pine-800 flex shrink-0 items-center justify-center rounded-full font-semibold ${sizeClass} ${textClass}`}
    >
      {nickname.charAt(0)}
    </div>
  );
}

export function ProfileCard({ nickname, email, avatarUrl }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  function finishEdit() {
    startTransition(() => {
      setOpen(false);
      setLocalError(null);
      setPreviewUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }
        return null;
      });
      router.refresh();
    });
  }

  const [nicknameState, nicknameAction, nicknamePending] = useActionState(
    async (prev: ActionResult, formData: FormData) => {
      const result = await updateProfileSettings(prev, formData);
      if (result.ok) {
        finishEdit();
      }
      return result;
    },
    initial,
  );
  const [avatarState, avatarAction, avatarPending] = useActionState(
    async (prev: ActionResult, formData: FormData) => {
      const result = await updateAvatar(prev, formData);
      if (result.ok) {
        finishEdit();
      }
      return result;
    },
    initial,
  );

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function closeModal() {
    setOpen(false);
    setLocalError(null);
    setPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return null;
    });
  }

  async function handleAvatarSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);
    const form = event.currentTarget;
    const input = form.elements.namedItem("avatar");
    if (!(input instanceof HTMLInputElement) || !input.files?.[0]) {
      setLocalError("이미지 파일을 선택해 주세요.");
      return;
    }

    try {
      const compressed = await compressAvatarFile(input.files[0]);
      const body = new FormData();
      body.set("avatar", compressed);
      startTransition(() => {
        avatarAction(body);
      });
    } catch (error) {
      setLocalError(
        error instanceof Error ? error.message : "이미지를 처리하지 못했어요.",
      );
    }
  }

  return (
    <>
      <section className="border-line flex items-center gap-4 rounded-xl border bg-white/60 p-4">
        <AvatarPreview
          nickname={nickname}
          avatarUrl={avatarUrl}
          sizeClass="size-16"
          textClass="text-2xl"
        />
        <div className="min-w-0 flex-1">
          <p className="text-pine-900 truncate text-lg font-semibold">
            {nickname}
          </p>
          {email ? <p className="text-muted truncate text-sm">{email}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="border-line text-pine-800 hover:bg-pine-50 shrink-0 rounded-lg border px-3 py-2 text-sm font-medium"
        >
          수정
        </button>
      </section>

      <Modal open={open} onClose={closeModal} title="프로필 수정">
        <div className="flex flex-col gap-5">
          <form onSubmit={handleAvatarSubmit} className="flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <AvatarPreview
                nickname={nickname}
                avatarUrl={previewUrl ?? avatarUrl}
                sizeClass="size-14"
                textClass="text-xl"
              />
              <label className="border-line text-pine-800 hover:bg-pine-50 cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium">
                {avatarPending ? "올리는 중" : "사진 변경"}
                <input
                  type="file"
                  name="avatar"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  disabled={avatarPending}
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    if (!file) {
                      return;
                    }
                    setPreviewUrl((current) => {
                      if (current) {
                        URL.revokeObjectURL(current);
                      }
                      return URL.createObjectURL(file);
                    });
                    event.currentTarget.form?.requestSubmit();
                  }}
                  className="sr-only"
                />
              </label>
            </div>
            <p className="text-muted text-xs">
              사진은 자동으로 줄여 최대 100KB로 저장돼요.
            </p>
            <AuthMessage
              result={
                localError
                  ? { ok: false, message: localError }
                  : avatarState.ok || avatarState.message
                    ? avatarState
                    : null
              }
            />
          </form>

          <form action={nicknameAction} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-pine-900 font-medium">닉네임</span>
              <input
                name="nickname"
                defaultValue={nickname}
                required
                minLength={2}
                maxLength={20}
                className="border-line bg-fog-50 focus:border-pine-500 h-12 rounded-lg border px-3 outline-none"
              />
            </label>
            {email ? (
              <p className="text-muted text-sm">이메일 · {email}</p>
            ) : null}
            <AuthMessage
              result={
                nicknameState.ok || nicknameState.message ? nicknameState : null
              }
            />
            <button
              type="submit"
              disabled={nicknamePending}
              className="bg-pine-800 text-fog-50 hover:bg-pine-700 h-12 rounded-lg font-semibold disabled:opacity-60"
            >
              {nicknamePending ? "저장 중" : "저장하기"}
            </button>
          </form>
        </div>
      </Modal>
    </>
  );
}
