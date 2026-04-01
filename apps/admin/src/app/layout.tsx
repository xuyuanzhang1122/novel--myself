import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "xu-novel admin",
  description: "Editorial workspace for xu-novel",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className="dark" lang="zh-CN">
      <body
        className="bg-stone-950 font-sans text-stone-100"
        style={
          {
            "--font-serif":
              "\"Songti SC\", \"Noto Serif SC\", \"Source Han Serif SC\", Georgia, serif",
            "--font-sans":
              "\"PingFang SC\", \"Helvetica Neue\", Helvetica, Arial, sans-serif",
          } as React.CSSProperties
        }
      >
        {children}
      </body>
    </html>
  );
}
