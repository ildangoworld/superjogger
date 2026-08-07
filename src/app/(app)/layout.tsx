import { BottomNav } from "@/components/layout/bottom-nav";
import { Wordmark } from "@/components/brand/wordmark";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="atmosphere flex min-h-dvh flex-1 flex-col">
      <header className="mx-auto w-full max-w-md px-5 pt-5">
        <Wordmark className="text-lg" />
      </header>
      <main className="mx-auto w-full max-w-md flex-1 px-5 pb-28">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
