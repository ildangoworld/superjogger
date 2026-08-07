import type { Metadata } from "next";
import { Bricolage_Grotesque, IBM_Plex_Sans_KR } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
});

const body = IBM_Plex_Sans_KR({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-body",
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
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
