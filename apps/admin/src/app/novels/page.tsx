import { redirect } from "next/navigation";

import Link from "next/link";

import { getAdminUser, listAllNovels } from "@xu-novel/lib";
import { Button, Panel } from "@xu-novel/ui";

import { AdminShell } from "../admin-shell";
import { FormWithError } from "../form-with-error";
import { ImageUploadField } from "../image-upload-field";
import { saveNovelAction } from "./actions";

export default async function NovelsPage() {
  const user = await getAdminUser();
  if (!user) {
    redirect("/login?redirectedFrom=/novels");
  }

  const novels = await listAllNovels();

  return (
    <AdminShell title="作品" subtitle="作品是前台书库的一级入口。只有状态为“已发布”的作品会出现在前台。">
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel className="space-y-5 border-stone-800 bg-stone-900/70">
          <h3 className="font-serif text-3xl">新建作品</h3>
          <p className="text-sm leading-7 text-stone-400">
            新作品默认直接发布，保存后会同步刷新前台书库；如果你只想先占位，改成“草稿”即可。
          </p>
          <FormWithError action={saveNovelAction} className="grid gap-4">
            <input name="id" type="hidden" />
            <input className="rounded-2xl bg-stone-950 px-4 py-3" name="title" placeholder="作品标题" required />
            <input className="rounded-2xl bg-stone-950 px-4 py-3" name="slug" placeholder="URL 标识，例如 chang-an" required />
            <textarea className="min-h-24 rounded-3xl bg-stone-950 px-4 py-3" name="summary" placeholder="作品简介" />
            <ImageUploadField
              folder="novels/covers"
              helpText="上传封面图后会自动填充表单。"
              label="封面图片"
              name="cover_url"
              previewClassName="aspect-[4/5]"
            />
            <ImageUploadField
              folder="novels/backdrops"
              helpText="用于作品详情页顶部背景。"
              label="背景图片"
              name="backdrop_url"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <select className="rounded-2xl bg-stone-950 px-4 py-3" name="status" defaultValue="published">
                <option value="draft">草稿（前台不可见）</option>
                <option value="published">已发布（前台可见）</option>
                <option value="archived">已归档</option>
              </select>
              <input
                className="rounded-2xl bg-stone-950 px-4 py-3"
                name="sort_order"
                type="number"
                placeholder="前台排序"
                defaultValue={1}
              />
            </div>
            <Button type="submit">保存作品</Button>
          </FormWithError>
        </Panel>
        <div className="space-y-4">
          {novels.map((novel) => (
            <Panel className="space-y-2 border-stone-800 bg-stone-900/70" key={novel.id}>
              <div className="flex items-center justify-between">
                <p className="text-xs tracking-[0.22em] text-stone-500">
                  {novel.status === "published"
                    ? "已发布"
                    : novel.status === "draft"
                      ? "草稿"
                      : "已归档"}
                </p>
                <Link className="text-xs underline text-stone-400" href={`/novels/${novel.id}/edit`}>编辑 / 删除作品</Link>
              </div>
              <Link href={`/novels/${novel.id}`} className="block group">
                <h3 className="font-serif text-2xl group-hover:text-[#c08457] transition">{novel.title}</h3>
                <p className="text-sm text-stone-400 mt-2">{novel.summary}</p>
              </Link>
            </Panel>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
