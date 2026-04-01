import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getImportJobById, getUser, splitMarkdownIntoChapters } from "@xu-novel/lib";
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
  const user = await getUser();
  if (!user) {
    redirect("/login?redirectedFrom=/imports");
  }

  const { id } = await params;
  const job = await getImportJobById(id);
  if (!job) notFound();

  const baseTitle = stripExtension(job.file_name);
  const { bookTitle, chapters: detectedChapters } = splitMarkdownIntoChapters(
    job.converted_markdown,
  );
  const novelTitle = bookTitle || baseTitle;

  const initialChapters = detectedChapters.map((ch, i) => ({
    title: ch.title,
    slug: slugify(ch.title, `chapter-${i + 1}`),
    content: ch.content,
  }));

  return (
    <AdminShell
      title={`导入稿：${job.file_name}`}
      subtitle={`自动检测到 ${detectedChapters.length} 个章节${bookTitle ? `，书名「${bookTitle}」` : ""}。校对后一键生成作品。`}
    >
      <div className="space-y-6">
        <Panel className="space-y-4 border-stone-800 bg-stone-900/70">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
                {job.status === "confirmed" ? "已生成" : "待处理"}
              </p>
              <h3 className="font-serif text-3xl">{job.file_name}</h3>
              <p className="text-sm leading-7 text-stone-400">
                当前导入包含 {Object.keys(job.image_manifest).length} 张已上传图片。你可以继续修改正文，再生成作品。
              </p>
            </div>
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
        </Panel>

        <FormWithError action={createNovelFromImportAction} className="grid gap-6">
          <input name="import_job_id" type="hidden" value={job.id} />

          <Panel className="space-y-5 border-stone-800 bg-stone-900/70">
            <h3 className="font-serif text-3xl">作品信息</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                className="rounded-2xl bg-stone-950 px-4 py-3"
                defaultValue={novelTitle}
                name="title"
                placeholder="作品标题"
                required
              />
              <input
                className="rounded-2xl bg-stone-950 px-4 py-3"
                defaultValue={slugify(novelTitle, `novel-${job.id.slice(0, 8)}`)}
                name="slug"
                placeholder="作品 URL 标识"
                required
              />
            </div>
            <textarea
              className="min-h-24 rounded-3xl bg-stone-950 px-4 py-3"
              name="summary"
              placeholder="作品简介"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <ImageUploadField
                folder="novels/covers"
                helpText="封面图会同时同步到前台与后台。"
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
              className="rounded-2xl bg-stone-950 px-4 py-3"
              defaultValue="published"
              name="status"
            >
              <option value="draft">草稿（前台不可见）</option>
              <option value="published">已发布（前台可见）</option>
              <option value="archived">已归档</option>
            </select>
          </Panel>

          <Panel className="space-y-5 border-stone-800 bg-stone-900/70">
            <h3 className="font-serif text-3xl">章节校对</h3>
            <ChapterImportForm chapters={initialChapters} />
          </Panel>

          <div className="flex justify-end">
            <Button type="submit">生成作品（{initialChapters.length} 章）</Button>
          </div>
        </FormWithError>
      </div>
    </AdminShell>
  );
}
