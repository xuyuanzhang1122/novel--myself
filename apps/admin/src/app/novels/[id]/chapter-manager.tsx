"use client";

import { useState, useCallback, useTransition, useEffect } from "react";
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
  const [isShelfOpen, setIsShelfOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(chapters.length === 0);
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

  useEffect(() => {
    if (activeId === "__new__") {
      setIsSettingsOpen(true);
    }
  }, [activeId]);

  return (
    <div className="space-y-5">
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

      <Panel className="min-w-0 space-y-5 border-stone-800 bg-stone-900/70">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.24em] text-stone-500">章节工作区</p>
            <h3 className="font-serif text-3xl">
              {active ? `正在编辑 · ${active.title}` : "新建章节"}
            </h3>
            <p className="text-sm leading-7 text-stone-400">
              章节目录和章节设置都可以收起，编辑区默认优先留给正文。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {formSuccess ? (
              <span className="rounded-full bg-emerald-900/60 px-3 py-1 text-xs text-emerald-300">
                {formSuccess}
              </span>
            ) : null}
            <Button
              onClick={() => setIsShelfOpen((current) => !current)}
              type="button"
              variant="ghost"
            >
              {isShelfOpen ? "收起章节目录" : `展开章节目录（${chapters.length}）`}
            </Button>
            <Button
              onClick={() => {
                setActiveId("__new__");
                setFormError("");
                setFormSuccess("");
              }}
              type="button"
              variant="secondary"
            >
              + 新建章节
            </Button>
          </div>
        </div>

        {isShelfOpen ? (
          <div className="space-y-3 rounded-[1.6rem] border border-stone-800/80 bg-stone-950/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.24em] text-stone-500">章节目录</p>
              <p className="text-xs text-stone-500">点击切换正在编辑的章节</p>
            </div>
            <div className="grid max-h-[24rem] gap-3 overflow-y-auto pr-1 md:grid-cols-2 2xl:grid-cols-3">
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
                  <p className="mt-2 font-serif text-xl tracking-tight text-stone-100">
                    {chapter.title}
                  </p>
                  <p className="mt-2 text-xs text-stone-500">{chapter.word_count} 字</p>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="id" value={active?.id ?? ""} />
          <input type="hidden" name="novel_id" value={novelId} />

          <div className="space-y-3 rounded-[1.6rem] border border-stone-800/80 bg-stone-950/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">章节设置</p>
                <p className="mt-1 text-sm text-stone-400">
                  标题、顺序和状态不必一直占着编辑区。
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
              <div className="space-y-4">
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
              </div>
            ) : (
              <div className="grid gap-3 text-sm text-stone-300 md:grid-cols-3">
                <p className="truncate">标题：{active?.title ?? "新章节"}</p>
                <p>序号：{active?.chapter_order ?? nextOrder}</p>
                <p>
                  状态：
                  {active?.status === "published"
                    ? "已发布"
                    : active?.status === "archived"
                      ? "已归档"
                      : "草稿"}
                </p>
              </div>
            )}
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
  );
}
