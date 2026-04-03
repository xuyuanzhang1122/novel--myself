"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { clampProgress, resolveProgressTarget } from "@xu-novel/lib/client";
import { Button, cn } from "@xu-novel/ui";

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
  const [focusMode, setFocusMode] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(clampProgress(fallbackProgress ?? 0));
  const [paragraphCount, setParagraphCount] = useState(0);
  const [activeParagraph, setActiveParagraph] = useState(0);
  const [estimatedMinutes, setEstimatedMinutes] = useState(1);

  useEffect(() => {
    const ids = Array.from(document.querySelectorAll<HTMLElement>(".prose-reader [id]")).map(
      (node) => node.id,
    );
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
    const paragraphIndexById = new Map(
      paragraphs.map((paragraph, index) => [paragraph.id, index + 1]),
    );
    setParagraphCount(paragraphs.length);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top)[0];

        if (visible?.target instanceof HTMLElement) {
          currentAnchor = visible.target.id;
          setActiveParagraph(paragraphIndexById.get(visible.target.id) ?? 0);
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

  useEffect(() => {
    const container = document.createElement("div");
    container.innerHTML = html;
    const text = (container.textContent ?? "").replace(/\s+/g, "");
    setEstimatedMinutes(Math.max(1, Math.ceil(text.length / 700)));
  }, [html]);

  useEffect(() => {
    let frame = 0;

    const updateProgress = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(maxScroll > 0 ? clampProgress(window.scrollY / maxScroll) : 0);
      frame = 0;
    };

    const handleScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [pathname]);

  const remainingMinutes = Math.max(1, Math.ceil((1 - scrollProgress) * estimatedMinutes));

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "sticky top-4 z-20 rounded-[1.75rem] border px-4 py-4 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.55)] backdrop-blur-xl",
          theme === "paper"
            ? "border-amber-200/70 bg-[rgba(255,248,235,0.82)]"
            : theme === "night"
              ? "border-stone-800/80 bg-stone-950/80"
              : "border-slate-200/70 bg-white/75",
        )}
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <ReaderBadge label="进度" value={`${Math.round(scrollProgress * 100)}%`} />
            <ReaderBadge
              label="段落"
              value={paragraphCount > 0 ? `${Math.max(activeParagraph, 1)}/${paragraphCount}` : "--"}
            />
            <ReaderBadge label="剩余" value={`${remainingMinutes} 分钟`} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              className={cn(
                "rounded-full px-4",
                focusMode && "bg-stone-950 text-stone-50 dark:bg-stone-100 dark:text-stone-950",
              )}
              onClick={() => setFocusMode((current) => !current)}
              variant="secondary"
            >
              {focusMode ? "退出沉浸" : "沉浸模式"}
            </Button>
            <Button
              onClick={() => setFontScale((current) => Math.max(0.9, current - 0.1))}
              variant="secondary"
            >
              A-
            </Button>
            <Button
              onClick={() => setFontScale((current) => Math.min(1.6, current + 0.1))}
              variant="secondary"
            >
              A+
            </Button>
            <Button
              onClick={() => setTheme("paper")}
              variant={theme === "paper" ? "primary" : "secondary"}
            >
              纸张
            </Button>
            <Button
              onClick={() => setTheme("night")}
              variant={theme === "night" ? "primary" : "secondary"}
            >
              夜间
            </Button>
            <Button
              onClick={() => setTheme("mist")}
              variant={theme === "mist" ? "primary" : "secondary"}
            >
              雾灰
            </Button>
          </div>
        </div>
      </div>

      <article
        className={cn(
          "relative overflow-hidden rounded-[2.5rem] border p-5 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.45)] transition-all duration-300 sm:p-8",
          theme === "paper"
            ? "paper-noise border-amber-200/80"
            : theme === "night"
              ? "border-stone-800 bg-stone-950 text-stone-100"
              : "border-sky-100 bg-slate-50",
          focusMode && "shadow-[0_44px_140px_-60px_rgba(0,0,0,0.7)]",
        )}
        style={{
          fontFamily: getFontFamily(initialFontFamily),
          fontSize: `${fontScale}rem`,
          lineHeight: focusMode ? 2.05 : 1.95,
        }}
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-40",
            theme === "paper"
              ? "bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.12),transparent_62%)]"
              : theme === "night"
                ? "bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.08),transparent_58%)]"
                : "bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.08),transparent_58%)]",
          )}
        />
        <div className={cn("relative", focusMode ? "mx-auto max-w-3xl" : getWidthClass(initialPageWidth))}>
          <div className="mb-8 space-y-4 border-b border-black/10 pb-6 dark:border-white/10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.28em] text-stone-500 dark:text-stone-400">
                  沉浸阅读
                </p>
                <p className="text-sm leading-7 text-stone-600 dark:text-stone-300">
                  进度会自动保存。调字号、主题或开启沉浸模式都会立即反映到正文。
                </p>
              </div>
              <div className="min-w-[180px] space-y-2">
                <div className="h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                  <div
                    className={cn(
                      "h-full rounded-full transition-[width] duration-300",
                      theme === "paper"
                        ? "bg-amber-500/75"
                        : theme === "night"
                          ? "bg-amber-300/70"
                          : "bg-sky-500/70",
                    )}
                    style={{ width: `${Math.round(scrollProgress * 100)}%` }}
                  />
                </div>
                <p className="text-right text-xs tracking-[0.2em] text-stone-500 dark:text-stone-400">
                  已读 {Math.round(scrollProgress * 100)}%
                </p>
              </div>
            </div>
          </div>

          <div className="prose-reader" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </article>
    </div>
  );
}

function ReaderBadge({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-black/10 bg-white/45 px-3 py-1.5 text-xs tracking-[0.22em] text-stone-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-stone-300">
      {label} {value}
    </span>
  );
}
