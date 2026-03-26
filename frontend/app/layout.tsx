import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { AppProviders } from "./_ui/app-providers";
import "./globals.css";

const pretendard = localFont({
  src: "../../packages/pretendard/web/variable/woff2/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  weight: "45 920",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "집비치기 — 가정 재고 관리",
  description:
    "Household·StorageLocation·InventoryItem 도메인에 맞춘 집 구조·재고 관리 UI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${pretendard.variable} ${geistMono.variable} h-full overflow-hidden antialiased`}
    >
      <body
        className={`${pretendard.variable} font-sans flex h-full min-h-0 flex-col overflow-hidden bg-zinc-950 text-zinc-100`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
