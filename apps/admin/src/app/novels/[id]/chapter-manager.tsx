"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button, Panel, cn } from "@xu-novel/ui";

import type { AdminActionResult } from "../../action-result";
import { getRedirectTargetFromError } from "../../action-result";
import { MarkdownEditor } from "./markdown-editor";

type ChapterItem = {
  id: string;
  title: string;
  slug: string;
  markdown_content: string;
  chapter_order: number;
  word_count: number;
  status: string;
};

type ChapterManagerProps = {
  novelId: string;
  chapters: ChapterItem[];
  saveAction: (formData: FormData) => Promise<AdminActionResult | void>;
};

export function ChapterManager({ novelId, chapters, saveAction }: ChapterManagerProps) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | "__new__">(
    chapters[0]?.id ?? "__new__",
  );
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  const active = activeId === "__new__" ? null : chapters.find((c) => c.id === activeId);
  const publishedCount = chapters.filter((chapter) => chapter.status === "published").length;
  const totalWordCount = chapters.reduce((sum, chapter) => sum + chapter.word_count, 0);

  const handleSubmit = useCallback(
    (formData: FormData) => {
      setFormError("");
      setFormSuccess("");
      startTransition(async () => {
        try {
          const result = await saveAction(formData);
          if (result?.chapterId) {
            setActiveId(result.chapterId);
          }
          setFormSuccess(result?.message ?? "保存成功");
          router.refresh();
          setTimeout(() => setFormSuccess(""), 3000);
        } catch (e: any) {
          const redirectTo = getRedirectTargetFromError(e);
          if (redirectTo) {
            router.push(redirectTo);
            return;
          }
          setFormError(e?.message ?? "保存失败");
        }
      });
    },
    [router, saveAction],
  );

  const nextOrder = chapters.length > 0
    ? Math.max(...chapters.map((c) => c.chapter_order)) + 1
    : 1;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["章节总数", String(chapters.length)],
            ["已发布", String(publishedCount)],
            ["总字数", totalWordCount.toLocaleString("zh-CN")],
          ].map(([label, value]) => (
            <Panel className="space-y-3 border-stone-800 bg-stone-900/70" key={label}>
              <p className="text-xs uppercase tracking-[0.24em] text-stone-500">{label}</p>
              <p className="font-serif text-3xl tracking-tight">{value}</p>
            </Panel>
          ))}
        </div>

        <Panel className="space-y-5 border-stone-800 bg-stone-900/70">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-serif text-3xl">
              {active ? "编辑章节" : "新建章节"}
            </h3>
            {formSuccess && (
              <span className="rounded-full bg-emerald-900/60 px-3 py-1 text-xs text-emerald-300">
                {formSuccess}
              </span>
            )}
          </div>
          <p className="text-sm leading-7 text-stone-400">
            {active
              ? "标题、顺序、状态和正文都在这一屏里完成，保存后会自动刷新章节列表。"
              : "先建章节骨架，再在下方写正文，保存后会自动切回新章节。"}
          </p>

          <form action={handleSubmit} className="space-y-4">
            <input type="hidden" name="id" value={active?.id ?? ""} />
            <input type="hidden" name="novel_id" value={novelId} />

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm text-stone-400">章节标题</span>
                <input
                  key={`title-${activeId}`}
                  className="w-full rounded-2xl border border-stone-800 bg-stone-950 px-4 py-3"
                  name="title"
                  placeholder="章节标题"
                  defaultValue={active?.title ?? ""}
                  required
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-stone-400">章节 URL 标识</span>
                <input
                  key={`slug-${activeId}`}
                  className="w-full rounded-2xl border border-stone-800 bg-stone-950 px-4 py-3"
                  name="slug"
                  placeholder="章节 URL 标识，例如 chapter-1"
                  defaultValue={active?.slug ?? ""}
                  required
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm text-stone-400">章节序号</span>
                <input
                  key={`order-${activeId}`}
                  className="w-full rounded-2xl border border-stone-800 bg-stone-950 px-4 py-3"
                  name="chapter_order"
                  type="number"
                  placeholder="章节序号"
                  defaultValue={active?.chapter_order ?? nextOrder}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-stone-400">发布状态</span>
                <select
                  key={`status-${activeId}`}
                  className="w-full rounded-2xl border border-stone-800 bg-stone-950 px-4 py-3"
                  name="status"
                  defaultValue={active?.status ?? "draft"}
                >
                  <option value="draft">草稿（前台不可见）</option>
                  <option value="published">已发布（前台可见）</option>
                  <option value="archived">已归档</option>
                </select>
              </label>
            </div>

            <MarkdownEditor
              key={`editor-${activeId}`}
              initialValue={
                active?.markdown_content ?? "# 新章节\n\n在这里开始写作。"
              }
              name="markdown_content"
            />

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isPending}>
                {isPending ? "保存中..." : "保存章节"}
              </Button>
              {formError && (
                <span className="text-sm text-amber-300">{formError}</span>
              )}
            </div>
          </form>
        </Panel>
      </div>

      <div className="space-y-3 xl:sticky xl:top-4 xl:self-start">
        <Panel className="space-y-4 border-stone-800 bg-stone-900/70">
          <p className="text-xs uppercase tracking-[0.24em] text-stone-500">章节列表</p>
          <Button
            className="w-full"
            onClick={() => setActiveId("__new__")}
            type="button"
            variant="secondary"
          >
            + 新建章节
          </Button>
          <p className="text-sm leading-7 text-stone-400">
            点击右侧章节会直接切换编辑对象，不用离开当前页面。
          </p>
        </Panel>

        <div className="space-y-3 xl:max-h-[calc(100vh-15rem)] xl:overflow-y-auto xl:pr-1">
          {chapters.map((chapter) => (
            <button
              className={cn(
                "w-full rounded-[1.6rem] border p-4 text-left transition",
                activeId === chapter.id
                  ? "border-amber-200/20 bg-amber-200/10 shadow-[0_18px_44px_-30px_rgba(251,191,36,0.45)]"
                  : "border-stone-800 bg-stone-900/70 hover:-translate-y-0.5 hover:border-stone-700 hover:bg-stone-900",
              )}
              key={chapter.id}
              onClick={() => {
                setActiveId(chapter.id);
                setFormError("");
                setFormSuccess("");
              }}
              type="button"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                {chapter.status === "published"
                  ? "已发布"
                  : chapter.status === "draft"
                    ? "草稿"
                    : "已归档"}
                {" · "}第 {chapter.chapter_order} 章
              </p>
              <p className="mt-2 font-serif text-xl tracking-tight text-stone-100">{chapter.title}</p>
              <p className="mt-2 text-xs text-stone-500">{chapter.word_count} 字</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
