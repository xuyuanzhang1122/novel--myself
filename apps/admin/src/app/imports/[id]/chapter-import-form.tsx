"use client";

import { useState, useCallback } from "react";

import { Button, Panel } from "@xu-novel/ui";

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

  const updateChapter = useCallback(
    (index: number, partial: Partial<ChapterData>) => {
      setChapters((prev) =>
        prev.map((ch, i) => (i === index ? { ...ch, ...partial } : ch)),
      );
    },
    [],
  );

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
    setChapters((prev) => prev.filter((_, i) => i !== index));
    if (activeIndex >= index && activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    } else if (activeIndex >= chapters.length - 1) {
      setActiveIndex(Math.max(0, chapters.length - 2));
    }
  }

  // Generate a stable key for each chapter to force React remount on switch
  const activeKey = `import-ch-${activeIndex}-${chapters.length}`;

  return (
    <div className="space-y-5">
      {/* hidden fields that carry all chapter data to the form action */}
      <input type="hidden" name="chapter_count" value={chapters.length} />
      {chapters.map((ch, i) => (
        <div key={i}>
          <input type="hidden" name={`chapter_title_${i}`} value={ch.title} />
          <input type="hidden" name={`chapter_slug_${i}`} value={ch.slug} />
          <input
            type="hidden"
            name={`chapter_content_${i}`}
            value={ch.content}
          />
        </div>
      ))}

      {/* chapter tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {chapters.map((ch, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveIndex(i)}
            className={`rounded-full px-4 py-1.5 text-sm transition ${
              i === activeIndex
                ? "bg-stone-100 text-stone-950"
                : "bg-stone-800 text-stone-300 hover:bg-stone-700"
            }`}
          >
            {ch.title || `章节 ${i + 1}`}
          </button>
        ))}
        <button
          type="button"
          onClick={addChapter}
          className="rounded-full border border-dashed border-stone-600 px-4 py-1.5 text-sm text-stone-400 transition hover:border-stone-400 hover:text-stone-200"
        >
          + 新增章节
        </button>
      </div>

      {/* active chapter editor */}
      {active && (
        <Panel className="space-y-4 border-stone-800 bg-stone-900/70">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="font-serif text-2xl">
              第 {activeIndex + 1} 章
            </h4>
            {chapters.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => removeChapter(activeIndex)}
              >
                删除此章
              </Button>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              key={`title-${activeKey}`}
              className="rounded-2xl bg-stone-950 px-4 py-3"
              defaultValue={active.title}
              onChange={(e) =>
                updateChapter(activeIndex, {
                  title: e.target.value,
                  slug: slugify(e.target.value, `chapter-${activeIndex + 1}`),
                })
              }
              placeholder="章节标题"
            />
            <input
              key={`slug-${activeKey}`}
              className="rounded-2xl bg-stone-950 px-4 py-3"
              defaultValue={active.slug}
              onChange={(e) =>
                updateChapter(activeIndex, { slug: e.target.value })
              }
              placeholder="章节 slug"
            />
          </div>

          <MarkdownEditor
            key={activeKey}
            initialValue={active.content}
            name={`__editor_content_${activeIndex}`}
            onChange={(val) => updateChapter(activeIndex, { content: val })}
            heightClass="h-[60vh]"
          />
        </Panel>
      )}

      <p className="text-sm text-stone-500">
        共 {chapters.length} 个章节。点击标签可切换章节进行校对。
      </p>
    </div>
  );
}
