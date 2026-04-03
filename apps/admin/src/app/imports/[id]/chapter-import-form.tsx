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

      <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-3">
          <Button className="w-full" onClick={addChapter} type="button" variant="secondary">
            + 新增章节
          </Button>

          <div className="space-y-3 xl:max-h-[calc(100vh-22rem)] xl:overflow-y-auto xl:pr-1">
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
                <p className="text-xs uppercase tracking-[0.18em] text-stone-500">第 {index + 1} 章</p>
                <p className="mt-2 line-clamp-2 font-serif text-xl tracking-tight text-stone-100">
                  {chapter.title || `章节 ${index + 1}`}
                </p>
                <p className="mt-2 text-xs text-stone-500">{chapterMetrics[index]?.words ?? 0} 字</p>
              </button>
            ))}
          </div>
        </div>

        {active ? (
          <Panel className="space-y-4 border-stone-800 bg-stone-900/70">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h4 className="font-serif text-2xl tracking-tight">第 {activeIndex + 1} 章</h4>
              {chapters.length > 1 ? (
                <Button onClick={() => removeChapter(activeIndex)} type="button" variant="ghost">
                  删除此章
                </Button>
              ) : null}
            </div>

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

            <MarkdownEditor
              heightClass="h-[62vh]"
              initialValue={active.content}
              key={activeKey}
              name={`__editor_content_${activeIndex}`}
              onChange={(value) => updateChapter(activeIndex, { content: value })}
            />
          </Panel>
        ) : null}
      </div>
    </div>
  );
}
