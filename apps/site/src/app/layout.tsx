import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "xu-novel",
  description: "A private reading room for unfinished manuscripts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body
        className="font-sans"
        style={
          {
            "--font-serif":
              '"Songti SC", "Noto Serif SC", "Source Han Serif SC", Georgia, serif',
            "--font-sans":
              '"PingFang SC", "Noto Sans SC", "Helvetica Neue", Helvetica, Arial, sans-serif',
          } as React.CSSProperties
        }
      >
        {children}
      </body>
    </html>
  );
}
