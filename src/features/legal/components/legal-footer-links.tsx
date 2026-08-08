import Link from "next/link";

type Props = {
  className?: string;
};

export function LegalFooterLinks({ className }: Props) {
  return (
    <p className={className ?? "text-muted text-xs leading-5"}>
      <Link
        href="/terms"
        className="text-pine-700 underline-offset-4 hover:underline"
      >
        이용약관
      </Link>
      <span aria-hidden className="mx-2 text-fog-400">
        ·
      </span>
      <Link
        href="/privacy"
        className="text-pine-700 underline-offset-4 hover:underline"
      >
        개인정보처리방침
      </Link>
    </p>
  );
}
