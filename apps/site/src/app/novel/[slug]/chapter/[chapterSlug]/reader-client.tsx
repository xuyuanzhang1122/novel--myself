"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { clampProgress, resolveProgressTarget } from "@xu-novel/lib/client";
import { Button } from "@xu-novel/ui";

type ReaderClientProps = {
  html: string;
  initialFontFamily: "serif" | "song" | "sans";
  initialFontScale: number;
  initialPageWidth: "narrow" | "standard" | "wide";
  initialTheme: "paper" | "night" | "mist";
  novelId: string;
  chapterId: string;
  anchorId?: string | null;
  fallbackProgress?: number | null;
};

function getWidthClass(pageWidth: ReaderClientProps["initialPageWidth"]) {
  if (pageWidth === "narrow") return "mx-auto max-w-3xl";
  if (pageWidth === "wide") return "mx-auto max-w-6xl";
  return "mx-auto max-w-4xl";
}

function getFontFamily(fontFamily: ReaderClientProps["initialFontFamily"]) {
  if (fontFamily === "sans") return "var(--font-sans)";
  return "var(--font-serif)";
}

export function ReaderClient({
  html,
  novelId,
  chapterId,
  anchorId,
  fallbackProgress,
  initialFontFamily,
  initialFontScale,
  initialPageWidth,
  initialTheme,
}: ReaderClientProps) {
  const pathname = usePathname();
  const [fontScale, setFontScale] = useState(initialFontScale);
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    const ids = Array.from(document.querySelectorAll<HTMLElement>(".prose-reader [id]")).map((node) => node.id);
    const target = resolveProgressTarget({ availableIds: ids, anchorId, fallbackProgress });

    if (target.type === "anchor") {
      document.getElementById(target.value)?.scrollIntoView({ block: "start" });
      return;
    }

    if (target.type === "percent") {
      window.scrollTo({
        top: document.documentElement.scrollHeight * clampProgress(Number(target.value)),
        behavior: "smooth",
      });
    }
  }, [anchorId, fallbackProgress, pathname]);

  useEffect(() => {
    let currentAnchor = anchorId ?? null;

    const paragraphs = Array.from(document.querySelectorAll<HTMLElement>(".prose-reader p[id]"));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top)[0];
        if (visible?.target instanceof HTMLElement) {
          currentAnchor = visible.target.id;
        }
      },
      { rootMargin: "-10% 0px -70% 0px", threshold: [0.1, 0.4, 0.7] },
    );

    paragraphs.forEach((paragraph) => observer.observe(paragraph));

    const saveProgress = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      void fetch("/api/reading-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          novelId,
          chapterId,
          anchorId: currentAnchor,
          fallbackProgress: clampProgress(progress),
        }),
        keepalive: true,
      });
    };

    const interval = window.setInterval(saveProgress, 12000);
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") saveProgress();
    };
    window.addEventListener("pagehide", saveProgress);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
      window.removeEventListener("pagehide", saveProgress);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [anchorId, chapterId, novelId]);

  useEffect(() => {
    setFontScale(initialFontScale);
    setTheme(initialTheme);
  }, [initialFontScale, initialTheme]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={() => setFontScale((current) => Math.max(0.9, current - 0.1))}>
          A-
        </Button>
        <Button variant="secondary" onClick={() => setFontScale((current) => Math.min(1.6, current + 0.1))}>
          A+
        </Button>
        <Button variant={theme === "paper" ? "primary" : "secondary"} onClick={() => setTheme("paper")}>
          纸张
        </Button>
        <Button variant={theme === "night" ? "primary" : "secondary"} onClick={() => setTheme("night")}>
          夜间
        </Button>
        <Button variant={theme === "mist" ? "primary" : "secondary"} onClick={() => setTheme("mist")}>
          雾灰
        </Button>
      </div>
      <article
        className={`${getWidthClass(initialPageWidth)} rounded-[2.5rem] border p-8 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.45)] ${
          theme === "paper"
            ? "paper-noise border-amber-200/80"
            : theme === "night"
              ? "border-stone-800 bg-stone-950 text-stone-100"
              : "border-sky-100 bg-slate-50"
        }`}
        style={{
          fontFamily: getFontFamily(initialFontFamily),
          fontSize: `${fontScale}rem`,
          lineHeight: 1.95,
        }}
      >
        <div className="prose-reader" dangerouslySetInnerHTML={{ __html: html }} />
      </article>
    </div>
  );
}
