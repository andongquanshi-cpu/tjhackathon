import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "愈星乡 · 21天正念训练营",
  description:
    "小愈陪你完成21天正念之旅：每日便签记录，四个心理学流派给你多重视角，沉淀你的心理画像。",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}