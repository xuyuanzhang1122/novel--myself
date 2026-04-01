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
import { Panel } from "@xu-novel/ui";

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
  const html = chapter.html_cache ?? (await markdownToHtml(chapter.markdown_content));
  const [history, preference] = await Promise.all([
    user ? getReadingHistory(user.id, novel.id) : Promise.resolve(null),
    user ? getReaderPreference(user.id) : Promise.resolve(null),
  ]);
  const currentPreference = preference ?? defaultReaderPreference;

  return (
    <SiteShell heading={novel.title} subheading={chapter.title}>
      <div className="grid gap-6 lg:grid-cols-[0.82fr_0.18fr]">
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
        <Panel className="space-y-4 h-fit">
          <p className="text-xs uppercase tracking-[0.28em] text-stone-500">目录</p>
          <div className="space-y-3">
            {chapters
              .filter((item) => item.status === "published")
              .map((item) => (
                <a
                  className={`block text-sm leading-6 ${item.id === chapter.id ? "text-stone-950" : "text-stone-500"}`}
                  href={`/novel/${novel.slug}/chapter/${item.slug}`}
                  key={item.id}
                >
                  {item.title}
                </a>
              ))}
          </div>
        </Panel>
      </div>
    </SiteShell>
  );
}
