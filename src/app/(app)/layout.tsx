import { BottomNav } from "@/components/layout/bottom-nav";
import { Wordmark } from "@/components/brand/wordmark";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="atmosphere flex min-h-dvh flex-1 flex-col">
      <a
        href="#main-content"
        className="bg-pine-800 text-fog-50 focus:ring-dawn-400 sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:px-3 focus:py-2 focus:ring-2"
      >
        본문으로 건너뛰기
      </a>
      <header className="mx-auto w-full max-w-md px-5 pt-5">
        <Wordmark className="text-lg" />
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-md flex-1 px-5 pb-28 outline-none"
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
