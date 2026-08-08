import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { LegalFooterLinks } from "@/features/legal/components/legal-footer-links";

const principles = [
  {
    title: "경쟁하지 않아요",
    body: "비교 대상은 다른 사람이 아니라 내가 직접 확정한 이번 주 목표예요.",
  },
  {
    title: "걷기도 똑같이 가치 있어요",
    body: "달리기, 걷기, 걷기·달리기 혼합 모두 같은 기준으로 인정해요.",
  },
  {
    title: "AI는 코치, 판정은 규칙",
    body: "AI는 기록을 해석하고 다음 운동 방향을 제안해요. 목표 인정은 명확한 규칙이 계산해요.",
  },
];

export default function WelcomePage() {
  return (
    <div className="atmosphere flex flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-6">
        <section className="flex min-h-dvh flex-col justify-center py-16">
          <p
            className="animate-rise text-pine-600 text-sm font-medium tracking-[0.2em] uppercase"
            style={{ animationDelay: "0ms" }}
          >
            AI 조깅 코치
          </p>
          <h1
            className="animate-rise mt-4 text-5xl sm:text-6xl"
            style={{ animationDelay: "120ms" }}
          >
            <Wordmark />
          </h1>
          <div
            className="pace-line animate-rise mt-8 w-full max-w-xs"
            style={{ animationDelay: "240ms" }}
          />
          <p
            className="animate-rise text-pine-900 mt-8 text-2xl font-semibold"
            style={{ animationDelay: "360ms" }}
          >
            나의 페이스로, 꾸준히.
          </p>
          <p
            className="animate-rise text-muted mt-3 max-w-md text-base leading-7"
            style={{ animationDelay: "480ms" }}
          >
            속도 경쟁 대신 내가 정한 주간 목표. 달리지 않아도 괜찮아요. 오늘
            몸에 맞게 10분부터 움직여보세요.
          </p>
          <div
            className="animate-rise mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
            style={{ animationDelay: "600ms" }}
          >
            <Link
              href="/login"
              className="group bg-pine-800 text-fog-50 hover:bg-pine-700 inline-flex h-12 items-center justify-center gap-2 rounded-lg px-7 text-base font-semibold transition-colors duration-300"
            >
              시작하기
              <span
                aria-hidden
                className="transition-transform duration-300 ease-out group-hover:translate-x-1"
              >
                →
              </span>
            </Link>
            <a
              href="#principles"
              className="text-pine-700 hover:text-pine-500 inline-flex h-12 items-center justify-center px-4 text-base font-medium underline-offset-8 transition-colors hover:underline"
            >
              서비스 원칙 보기
            </a>
          </div>
        </section>

        <section id="principles" className="pb-24">
          <h2 className="text-fog-500 text-sm font-semibold tracking-[0.2em] uppercase">
            Principles
          </h2>
          <ul className="mt-8 flex flex-col gap-10">
            {principles.map((item) => (
              <li key={item.title} className="border-pine-300 border-l-2 pl-5">
                <h3 className="text-pine-900 text-lg font-semibold">
                  {item.title}
                </h3>
                <p className="text-muted mt-2 max-w-md leading-7">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <footer className="border-line border-t">
        <div className="mx-auto flex w-full max-w-md flex-col gap-3 px-6 py-6">
          <div className="flex items-center justify-between gap-4">
            <Wordmark className="text-sm" />
            <p className="text-fog-500 text-xs leading-5">
              기록을 해석하고 방향을 제안할 뿐, 의료적 진단을 하지 않아요.
            </p>
          </div>
          <LegalFooterLinks />
        </div>
      </footer>
    </div>
  );
}
