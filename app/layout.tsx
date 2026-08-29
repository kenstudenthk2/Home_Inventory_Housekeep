import type { Metadata } from "next";
import { Funnel_Sans, Inter, Geist } from "next/font/google";
import { AppHeader } from "@/components/AppHeader";
import { listRooms } from "@/lib/db/rooms";
import "./globals.css";

const funnelSans = Funnel_Sans({
  subsets: ["latin"],
  variable: "--font-funnel-sans",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "家居物品管理",
  description: "記錄每個房間、每件傢俬入面有咩物品",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const rooms = await listRooms();

  return (
    <html lang="zh-Hant" className={`${funnelSans.variable} ${inter.variable} ${geist.variable}`}>
      <body className="min-h-screen bg-bg text-ink antialiased">
        <AppHeader rooms={rooms} />
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
