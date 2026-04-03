import Link from "next/link";
import { notFound } from "next/navigation";

import {
  defaultReaderPreference,
  getChapterBySlug,
  getNovelBySlug,
  getReaderPreference,
  getReadingHistory,
  getUser,
  listChaptersForNovel,
  markdownToHtml,
} from "@xu-novel/lib";
import { Panel, cn } from "@xu-novel/ui";

import { SiteShell } from "../../../../site-shell";
import { ReaderClient } from "./reader-client";

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ slug: string; chapterSlug: string }>;
}) {
  const { slug, chapterSlug } = await params;
  const novel = await getNovelBySlug(slug);
  if (!novel) notFound();

  const chapter = await getChapterBySlug(novel.id, chapterSlug);
  if (!chapter) notFound();

  const user = await getUser();
  const chapters = await listChaptersForNovel(novel.id);
  const publishedChapters = chapters.filter((item) => item.status === "published");
  const currentChapterIndex = publishedChapters.findIndex((item) => item.id === chapter.id);
  const previousChapter = currentChapterIndex > 0 ? publishedChapters[currentChapterIndex - 1] : null;
  const nextChapter =
    currentChapterIndex >= 0 && currentChapterIndex < publishedChapters.length - 1
      ? publishedChapters[currentChapterIndex + 1]
      : null;
  const html = chapter.html_cache ?? (await markdownToHtml(chapter.markdown_content));
  const [history, preference] = await Promise.all([
    user ? getReadingHistory(user.id, novel.id) : Promise.resolve(null),
    user ? getReaderPreference(user.id) : Promise.resolve(null),
  ]);
  const currentPreference = preference ?? defaultReaderPreference;

  return (
    <SiteShell heading={novel.title} subheading={chapter.title}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <ReaderClient
            anchorId={history?.anchor_id}
            chapterId={chapter.id}
            fallbackProgress={history?.fallback_progress}
            html={html}
            initialFontFamily={currentPreference.font_family}
            initialFontScale={currentPreference.font_scale}
            initialPageWidth={currentPreference.page_width}
            initialTheme={currentPreference.theme}
            novelId={novel.id}
          />

          <Panel className="space-y-4 border-stone-200/80 bg-white/72 dark:border-stone-800/80 dark:bg-stone-950/70">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.28em] text-stone-500">章节切换</p>
              <h2 className="font-serif text-2xl tracking-tight">继续往前或往后</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {previousChapter ? (
                <Link
                  className="rounded-[1.6rem] border border-stone-200/80 bg-white/70 px-4 py-4 transition hover:-translate-y-0.5 hover:border-stone-500 hover:bg-white dark:border-stone-800/80 dark:bg-stone-900/50 dark:hover:border-stone-600 dark:hover:bg-stone-900"
                  href={`/novel/${novel.slug}/chapter/${previousChapter.slug}`}
                >
                  <p className="text-xs uppercase tracking-[0.22em] text-stone-500">上一章</p>
                  <p className="mt-2 font-serif text-xl tracking-tight">{previousChapter.title}</p>
                </Link>
              ) : (
                <div className="rounded-[1.6rem] border border-dashed border-stone-200/80 px-4 py-4 text-sm text-stone-500 dark:border-stone-800/80 dark:text-stone-400">
                  已经是第一章。
                </div>
              )}

              {nextChapter ? (
                <Link
                  className="rounded-[1.6rem] border border-stone-200/80 bg-white/70 px-4 py-4 transition hover:-translate-y-0.5 hover:border-stone-500 hover:bg-white dark:border-stone-800/80 dark:bg-stone-900/50 dark:hover:border-stone-600 dark:hover:bg-stone-900"
                  href={`/novel/${novel.slug}/chapter/${nextChapter.slug}`}
                >
                  <p className="text-xs uppercase tracking-[0.22em] text-stone-500">下一章</p>
                  <p className="mt-2 font-serif text-xl tracking-tight">{nextChapter.title}</p>
                </Link>
              ) : (
                <div className="rounded-[1.6rem] border border-dashed border-stone-200/80 px-4 py-4 text-sm text-stone-500 dark:border-stone-800/80 dark:text-stone-400">
                  已经是最后一章。
                </div>
              )}
            </div>
          </Panel>
        </div>
        <aside className="relative lg:block">
          <Panel className="h-fit space-y-4 lg:sticky lg:top-28 lg:max-h-[calc(100vh-8.5rem)] lg:overflow-hidden lg:self-start lg:border-stone-300/80 lg:bg-white/82 lg:transition lg:duration-300 lg:hover:-translate-y-1 lg:hover:shadow-[0_28px_80px_-42px_rgba(24,24,27,0.45)] dark:lg:border-stone-700/80 dark:lg:bg-stone-950/72">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.28em] text-stone-500">目录</p>
              <div className="flex items-end justify-between gap-3">
                <h2 className="font-serif text-2xl tracking-tight">章节导航</h2>
                <span className="rounded-full border border-stone-300/80 px-2.5 py-1 text-[11px] uppercase tracking-[0.22em] text-stone-500 dark:border-stone-700/80 dark:text-stone-400">
                  {publishedChapters.length} 章
                </span>
              </div>
              <p className="text-sm leading-6 text-stone-500 dark:text-stone-400">
                当前是第 {currentChapterIndex + 1} 章，目录会固定在右侧方便切换。
              </p>
            </div>

            <div className="space-y-2 lg:max-h-[calc(100vh-16rem)] lg:overflow-y-auto lg:pr-1">
              {publishedChapters.map((item, index) => {
                const isActive = item.id === chapter.id;

                return (
                  <Link
                    className={cn(
                      "group flex items-start gap-3 rounded-[1.5rem] border px-3 py-3 transition duration-200",
                      isActive
                        ? "border-stone-900 bg-stone-950 text-stone-50 shadow-[0_18px_40px_-28px_rgba(24,24,27,0.65)] dark:border-stone-100 dark:bg-stone-100 dark:text-stone-950"
                        : "border-stone-200/80 bg-white/55 text-stone-600 hover:-translate-y-0.5 hover:border-stone-500 hover:bg-white hover:text-stone-950 dark:border-stone-800/80 dark:bg-stone-900/45 dark:text-stone-300 dark:hover:border-stone-600 dark:hover:bg-stone-900 dark:hover:text-stone-100",
                    )}
                    href={`/novel/${novel.slug}/chapter/${item.slug}`}
                    key={item.id}
                  >
                    <span
                      className={cn(
                        "mt-0.5 inline-flex min-w-9 justify-center rounded-full px-2 py-1 text-[11px] font-medium tracking-[0.18em] transition",
                        isActive
                          ? "bg-white/12 text-stone-200 dark:bg-stone-900/15 dark:text-stone-700"
                          : "bg-stone-100 text-stone-500 group-hover:bg-stone-950 group-hover:text-stone-50 dark:bg-stone-800 dark:text-stone-400 dark:group-hover:bg-stone-100 dark:group-hover:text-stone-950",
                      )}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 space-y-1">
                      <span className="block text-sm font-medium leading-6">
                        {item.title}
                      </span>
                      <span
                        className={cn(
                          "block text-xs leading-5 transition",
                          isActive
                            ? "text-stone-300 dark:text-stone-600"
                            : "text-stone-400 group-hover:text-stone-600 dark:text-stone-500 dark:group-hover:text-stone-300",
                        )}
                      >
                        {isActive ? "当前阅读章节" : "跳转到这一章"}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </Panel>
        </aside>
      </div>
    </SiteShell>
  );
}
