"use client";

import { useCallback, useMemo, useState } from "react";

import { Button, Panel, cn } from "@xu-novel/ui";

import { MarkdownEditor } from "../../novels/[id]/markdown-editor";

type ChapterData = {
  title: string;
  slug: string;
  content: string;
};

function slugify(value: string, fallback: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[\s_]+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || fallback
  );
}

export function ChapterImportForm({
  chapters: initialChapters,
}: {
  chapters: ChapterData[];
}) {
  const [chapters, setChapters] = useState<ChapterData[]>(initialChapters);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isChapterListOpen, setIsChapterListOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);

  const active = chapters[activeIndex];

  const updateChapter = useCallback((index: number, partial: Partial<ChapterData>) => {
    setChapters((prev) => prev.map((chapter, currentIndex) => (currentIndex === index ? { ...chapter, ...partial } : chapter)));
  }, []);

  function addChapter() {
    const newIndex = chapters.length;
    setChapters((prev) => [
      ...prev,
      { title: `第${newIndex + 1}章`, slug: `chapter-${newIndex + 1}`, content: "" },
    ]);
    setActiveIndex(newIndex);
    setIsSettingsOpen(true);
  }

  function removeChapter(index: number) {
    if (chapters.length <= 1) return;

    setChapters((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
    if (activeIndex >= index && activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    } else if (activeIndex >= chapters.length - 1) {
      setActiveIndex(Math.max(0, chapters.length - 2));
    }
  }

  const activeKey = `import-ch-${activeIndex}-${chapters.length}`;
  const chapterMetrics = useMemo(
    () =>
      chapters.map((chapter) => ({
        words: chapter.content.replace(/\s+/g, "").length,
      })),
    [chapters],
  );

  return (
    <div className="space-y-5">
      <input name="chapter_count" type="hidden" value={chapters.length} />
      {chapters.map((chapter, index) => (
        <div key={index}>
          <input name={`chapter_title_${index}`} type="hidden" value={chapter.title} />
          <input name={`chapter_slug_${index}`} type="hidden" value={chapter.slug} />
          <input name={`chapter_content_${index}`} type="hidden" value={chapter.content} />
        </div>
      ))}

      {active ? (
        <Panel className="min-w-0 space-y-5 border-stone-800 bg-stone-900/70">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.24em] text-stone-500">码字工作区</p>
              <h4 className="font-serif text-2xl tracking-tight">
                第 {activeIndex + 1} 章 {active.title ? `· ${active.title}` : ""}
              </h4>
              <p className="text-sm leading-7 text-stone-400">
                章节目录和章节设置都可以收起，把空间留给正文。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setIsChapterListOpen((current) => !current)}
                type="button"
                variant="ghost"
              >
                {isChapterListOpen ? "收起章节目录" : `展开章节目录（${chapters.length}）`}
              </Button>
              <Button onClick={addChapter} type="button" variant="secondary">
                + 新增章节
              </Button>
              {chapters.length > 1 ? (
                <Button onClick={() => removeChapter(activeIndex)} type="button" variant="ghost">
                  删除此章
                </Button>
              ) : null}
            </div>
          </div>

          {isChapterListOpen ? (
            <div className="space-y-3 rounded-[1.6rem] border border-stone-800/80 bg-stone-950/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">章节目录</p>
                <p className="text-xs text-stone-500">点击切换当前章节</p>
              </div>
              <div className="grid max-h-[24rem] gap-3 overflow-y-auto pr-1 md:grid-cols-2 2xl:grid-cols-3">
                {chapters.map((chapter, index) => (
                  <button
                    className={cn(
                      "w-full rounded-[1.5rem] border p-4 text-left transition",
                      index === activeIndex
                        ? "border-amber-200/20 bg-amber-200/10"
                        : "border-stone-800 bg-stone-950/60 hover:-translate-y-0.5 hover:border-stone-700 hover:bg-stone-950",
                    )}
                    key={`${chapter.slug}-${index}`}
                    onClick={() => setActiveIndex(index)}
                    type="button"
                  >
                    <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                      第 {index + 1} 章
                    </p>
                    <p className="mt-2 line-clamp-2 font-serif text-xl tracking-tight text-stone-100">
                      {chapter.title || `章节 ${index + 1}`}
                    </p>
                    <p className="mt-2 text-xs text-stone-500">
                      {chapterMetrics[index]?.words ?? 0} 字
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-3 rounded-[1.6rem] border border-stone-800/80 bg-stone-950/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">章节设置</p>
                <p className="mt-1 text-sm text-stone-400">
                  标题和 slug 不需要一直铺开，写作时可以先收起。
                </p>
              </div>
              <Button
                onClick={() => setIsSettingsOpen((current) => !current)}
                type="button"
                variant="ghost"
              >
                {isSettingsOpen ? "收起设置" : "展开设置"}
              </Button>
            </div>

            {isSettingsOpen ? (
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  className="rounded-2xl border border-stone-800 bg-stone-950 px-4 py-3"
                  defaultValue={active.title}
                  key={`title-${activeKey}`}
                  onChange={(event) =>
                    updateChapter(activeIndex, {
                      title: event.target.value,
                      slug: slugify(event.target.value, `chapter-${activeIndex + 1}`),
                    })
                  }
                  placeholder="章节标题"
                />
                <input
                  className="rounded-2xl border border-stone-800 bg-stone-950 px-4 py-3"
                  defaultValue={active.slug}
                  key={`slug-${activeKey}`}
                  onChange={(event) => updateChapter(activeIndex, { slug: event.target.value })}
                  placeholder="章节 slug"
                />
              </div>
            ) : (
              <div className="grid gap-3 text-sm text-stone-300 md:grid-cols-2">
                <p className="truncate">标题：{active.title || `章节 ${activeIndex + 1}`}</p>
                <p className="truncate">slug：{active.slug}</p>
              </div>
            )}
          </div>

          <MarkdownEditor
            heightClass="h-[68vh]"
            initialValue={active.content}
            key={activeKey}
            name={`__editor_content_${activeIndex}`}
            onChange={(value) => updateChapter(activeIndex, { content: value })}
          />
        </Panel>
      ) : null}
    </div>
  );
}
