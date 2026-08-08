import { Wordmark } from "@/components/brand/wordmark";
import { LegalFooterLinks } from "@/features/legal/components/legal-footer-links";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="atmosphere flex min-h-dvh flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-10">
        <Wordmark className="text-xl" />
        <div className="mt-10 flex flex-1 flex-col">{children}</div>
        <footer className="mt-10">
          <LegalFooterLinks />
        </footer>
      </div>
    </div>
  );
}
