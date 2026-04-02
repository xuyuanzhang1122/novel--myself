"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button, Panel } from "@xu-novel/ui";

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
    <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
      {/* Main editor area */}
      <div className="min-w-0 space-y-5">
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
              ? "修改后点击「保存章节」更新内容。"
              : "填写章节信息后点击「保存章节」创建新章节。"}
          </p>

          <form action={handleSubmit} className="space-y-4">
            <input type="hidden" name="id" value={active?.id ?? ""} />
            <input type="hidden" name="novel_id" value={novelId} />

            <div className="grid gap-4 md:grid-cols-2">
              <input
                key={`title-${activeId}`}
                className="w-full rounded-2xl bg-stone-950 px-4 py-3"
                name="title"
                placeholder="章节标题"
                defaultValue={active?.title ?? ""}
                required
              />
              <input
                key={`slug-${activeId}`}
                className="w-full rounded-2xl bg-stone-950 px-4 py-3"
                name="slug"
                placeholder="章节 URL 标识，例如 chapter-1"
                defaultValue={active?.slug ?? ""}
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                key={`order-${activeId}`}
                className="rounded-2xl bg-stone-950 px-4 py-3"
                name="chapter_order"
                type="number"
                placeholder="章节序号"
                defaultValue={active?.chapter_order ?? nextOrder}
              />
              <select
                key={`status-${activeId}`}
                className="rounded-2xl bg-stone-950 px-4 py-3"
                name="status"
                defaultValue={active?.status ?? "draft"}
              >
                <option value="draft">草稿（前台不可见）</option>
                <option value="published">已发布（前台可见）</option>
                <option value="archived">已归档</option>
              </select>
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

      {/* Sidebar: chapter list */}
      <div className="space-y-3">
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => setActiveId("__new__")}
        >
          + 新建章节
        </Button>

        {chapters.map((chapter) => (
          <button
            key={chapter.id}
            type="button"
            onClick={() => {
              setActiveId(chapter.id);
              setFormError("");
              setFormSuccess("");
            }}
            className={`w-full rounded-2xl border p-4 text-left transition ${
              activeId === chapter.id
                ? "border-stone-600 bg-stone-800/80"
                : "border-stone-800 bg-stone-900/70 hover:border-stone-700"
            }`}
          >
            <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
              {chapter.status === "published"
                ? "已发布"
                : chapter.status === "draft"
                  ? "草稿"
                  : "已归档"}
              {" · "}第 {chapter.chapter_order} 章
            </p>
            <p className="mt-1 font-serif text-lg">{chapter.title}</p>
            <p className="mt-1 text-xs text-stone-500">{chapter.word_count} 字</p>
          </button>
        ))}
      </div>
    </div>
  );
}
