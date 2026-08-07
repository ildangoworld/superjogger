import type { Metadata } from "next";
import { Noto_Sans_KR, Outfit } from "next/font/google";
import "./globals.css";

const body = Noto_Sans_KR({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

/** Latin-only brand face for the English wordmark. Not used for Korean UI. */
const brand = Outfit({
  weight: ["600", "700"],
  subsets: ["latin"],
  variable: "--font-brand",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SuperJogger — 나의 페이스로, 꾸준히",
    template: "%s | SuperJogger",
  },
  description:
    "무리한 기록 경쟁보다, 각자의 몸 상태에 맞춰 꾸준히 움직이도록 돕는 AI 조깅 코치",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${body.variable} ${brand.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
