import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  getAdminUser,
  getImportJobById,
  splitMarkdownIntoChapters,
} from "@xu-novel/lib";
import { Button, Panel } from "@xu-novel/ui";

import { AdminShell } from "../../admin-shell";
import { FormWithError } from "../../form-with-error";
import { ImageUploadField } from "../../image-upload-field";
import { createNovelFromImportAction, deleteImportJobAction } from "../actions";
import { ChapterImportForm } from "./chapter-import-form";

function stripExtension(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "");
}

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

export default async function ImportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getAdminUser();
  if (!user) {
    redirect("/login?redirectedFrom=/imports");
  }

  const { id } = await params;
  const job = await getImportJobById(id);
  if (!job) notFound();

  const baseTitle = stripExtension(job.file_name);
  const { bookTitle, chapters: detectedChapters } = splitMarkdownIntoChapters(job.converted_markdown);
  const novelTitle = bookTitle || baseTitle;

  const initialChapters = detectedChapters.map((chapter, index) => ({
    title: chapter.title,
    slug: slugify(chapter.title, `chapter-${index + 1}`),
    content: chapter.content,
  }));
  const totalWords = initialChapters.reduce(
    (sum, chapter) => sum + chapter.content.replace(/\s+/g, "").length,
    0,
  );

  return (
    <AdminShell
      title={`导入稿：${job.file_name}`}
      subtitle={`自动检测到 ${detectedChapters.length} 个章节${bookTitle ? `，书名「${bookTitle}」` : ""}。校对后一键生成作品。`}
    >
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["检测章节", String(initialChapters.length)],
            ["上传图片", String(Object.keys(job.image_manifest).length)],
            ["正文字符", totalWords.toLocaleString("zh-CN")],
            ["状态", job.status],
          ].map(([label, value]) => (
            <Panel className="space-y-3 border-stone-800 bg-stone-900/70" key={label}>
              <p className="text-xs uppercase tracking-[0.22em] text-stone-500">{label}</p>
              <p className="font-serif text-3xl tracking-tight">{value}</p>
            </Panel>
          ))}
        </div>

        <Panel className="space-y-4 border-stone-800 bg-stone-900/70">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
                {job.status === "confirmed" ? "已生成" : "待处理"}
              </p>
              <h3 className="font-serif text-3xl tracking-tight">{job.file_name}</h3>
              <p className="text-sm leading-7 text-stone-400">
                你可以继续修改章节标题、slug 和正文，再决定生成成稿还是删除本次导入。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link className="text-sm text-stone-400 underline underline-offset-4" href="/imports">
                返回导入列表
              </Link>
              <FormWithError action={deleteImportJobAction}>
                <input name="import_job_id" type="hidden" value={job.id} />
                <Button type="submit" variant="secondary">
                  删除此导入
                </Button>
              </FormWithError>
            </div>
          </div>
        </Panel>

        <FormWithError action={createNovelFromImportAction} className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_360px]">
          <input name="import_job_id" type="hidden" value={job.id} />

          <div className="min-w-0 space-y-5">
            <Panel className="space-y-5 border-stone-800 bg-stone-900/70">
              <h3 className="font-serif text-3xl tracking-tight">作品信息</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  className="rounded-2xl border border-stone-800 bg-stone-950 px-4 py-3"
                  defaultValue={novelTitle}
                  name="title"
                  placeholder="作品标题"
                  required
                />
                <input
                  className="rounded-2xl border border-stone-800 bg-stone-950 px-4 py-3"
                  defaultValue={slugify(novelTitle, `novel-${job.id.slice(0, 8)}`)}
                  name="slug"
                  placeholder="作品 URL 标识"
                  required
                />
              </div>
              <textarea
                className="min-h-24 rounded-3xl border border-stone-800 bg-stone-950 px-4 py-3"
                name="summary"
                placeholder="作品简介"
              />
              <div className="grid gap-4 md:grid-cols-2">
                <ImageUploadField
                  folder="novels/covers"
                  helpText="封面图会同步到前台与后台。"
                  label="封面图片"
                  name="cover_url"
                  previewClassName="aspect-[4/5]"
                />
                <ImageUploadField
                  folder="novels/backdrops"
                  helpText="用于作品详情页背景。建议选择横图。"
                  label="背景图片"
                  name="backdrop_url"
                />
              </div>
              <select
                className="rounded-2xl border border-stone-800 bg-stone-950 px-4 py-3"
                defaultValue="published"
                name="status"
              >
                <option value="draft">草稿（前台不可见）</option>
                <option value="published">已发布（前台可见）</option>
                <option value="archived">已归档</option>
              </select>
            </Panel>

            <Panel className="space-y-5 border-stone-800 bg-stone-900/70">
              <h3 className="font-serif text-3xl tracking-tight">章节校对</h3>
              <ChapterImportForm chapters={initialChapters} />
            </Panel>
          </div>

          <div className="space-y-5 2xl:sticky 2xl:top-4 2xl:self-start">
            <Panel className="space-y-4 border-stone-800 bg-stone-900/70">
              <p className="text-xs uppercase tracking-[0.28em] text-stone-500">生成前检查</p>
              <div className="space-y-3 text-sm leading-7 text-stone-300">
                <p>确认书名、slug 和封面没问题。</p>
                <p>确认章节标题和顺序正确。</p>
                <p>确认正文已经清掉导入噪音。</p>
              </div>
              <Button className="w-full" type="submit">
                生成作品（{initialChapters.length} 章）
              </Button>
            </Panel>

            <Panel className="space-y-4 border-stone-800 bg-stone-900/70">
              <p className="text-xs uppercase tracking-[0.28em] text-stone-500">导入摘要</p>
              <div className="space-y-3 text-sm leading-7 text-stone-300">
                <p>推断书名：{novelTitle}</p>
                <p>章节数：{initialChapters.length}</p>
                <p>图片数：{Object.keys(job.image_manifest).length}</p>
              </div>
            </Panel>
          </div>
        </FormWithError>
      </div>
    </AdminShell>
  );
}
