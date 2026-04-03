import { redirect } from "next/navigation";
import Link from "next/link";

import { getAdminUser, listAllNovels, listChaptersForNovel } from "@xu-novel/lib";
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
  const chapterCounts = await Promise.all(
    novels.map(async (novel) => {
      const chapters = await listChaptersForNovel(novel.id);
      return [novel.id, chapters.length] as const;
    }),
  );
  const chapterCountMap = new Map(chapterCounts);
  const publishedCount = novels.filter((novel) => novel.status === "published").length;
  const draftCount = novels.filter((novel) => novel.status === "draft").length;

  return (
    <AdminShell
      title="作品"
      subtitle="作品清单、章节入口和新建表单放在同一屏里，减少你在后台来回跳。"
    >
      <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="space-y-5 xl:sticky xl:top-4 xl:self-start">
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
            {[
              ["作品总数", String(novels.length)],
              ["已发布", String(publishedCount)],
              ["草稿", String(draftCount)],
            ].map(([label, value]) => (
              <Panel className="space-y-3 border-stone-800 bg-stone-900/70" key={label}>
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">{label}</p>
                <p className="font-serif text-3xl tracking-tight">{value}</p>
              </Panel>
            ))}
          </div>

          <Panel className="space-y-5 border-stone-800 bg-stone-900/70">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.28em] text-stone-500">新建作品</p>
              <h3 className="font-serif text-3xl tracking-tight">创建新的阅读入口</h3>
              <p className="text-sm leading-7 text-stone-400">
                新作品默认直接发布。如果你只想先占位，把状态改成“草稿”即可。
              </p>
            </div>

            <FormWithError action={saveNovelAction} className="grid gap-4">
              <input name="id" type="hidden" />
              <input
                className="rounded-2xl border border-stone-800 bg-stone-950 px-4 py-3"
                name="title"
                placeholder="作品标题"
                required
              />
              <input
                className="rounded-2xl border border-stone-800 bg-stone-950 px-4 py-3"
                name="slug"
                placeholder="URL 标识，例如 chang-an"
                required
              />
              <textarea
                className="min-h-24 rounded-3xl border border-stone-800 bg-stone-950 px-4 py-3"
                name="summary"
                placeholder="作品简介"
              />
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
                <select
                  className="rounded-2xl border border-stone-800 bg-stone-950 px-4 py-3"
                  defaultValue="published"
                  name="status"
                >
                  <option value="draft">草稿（前台不可见）</option>
                  <option value="published">已发布（前台可见）</option>
                  <option value="archived">已归档</option>
                </select>
                <input
                  className="rounded-2xl border border-stone-800 bg-stone-950 px-4 py-3"
                  defaultValue={1}
                  name="sort_order"
                  placeholder="前台排序"
                  type="number"
                />
              </div>
              <Button type="submit">保存作品</Button>
            </FormWithError>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel className="space-y-4 border-stone-800 bg-stone-900/70">
            <div className="flex items-end justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.28em] text-stone-500">作品清单</p>
                <h3 className="font-serif text-3xl tracking-tight">继续管理现有作品</h3>
              </div>
              <p className="text-sm text-stone-400">点击作品名进章节，点击设置进作品配置。</p>
            </div>
          </Panel>

          <div className="grid gap-4 xl:grid-cols-2">
            {novels.map((novel, index) => (
              <Panel
                className="overflow-hidden border-stone-800 bg-stone-900/70 p-0 transition hover:-translate-y-1 hover:border-stone-700"
                key={novel.id}
              >
                <div
                  className="relative aspect-[5/3] bg-cover bg-center"
                  style={{
                    backgroundImage: `linear-gradient(180deg,rgba(10,10,10,0.15),rgba(10,10,10,0.75)), url(${novel.backdrop_url ?? novel.cover_url ?? ""})`,
                  }}
                >
                  <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 py-5">
                    <span className="rounded-full border border-white/15 bg-black/25 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-stone-200">
                      {novel.status === "published"
                        ? "已发布"
                        : novel.status === "draft"
                          ? "草稿"
                          : "已归档"}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.24em] text-stone-300">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 space-y-2 px-5 py-5">
                    <p className="font-serif text-3xl tracking-tight text-stone-50">{novel.title}</p>
                    <p className="text-sm text-stone-300">
                      {chapterCountMap.get(novel.id) ?? 0} 章
                    </p>
                  </div>
                </div>
                <div className="space-y-4 px-5 py-5">
                  <p className="line-clamp-3 text-sm leading-7 text-stone-400">
                    {novel.summary || "还没有填写简介。"}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link href={`/novels/${novel.id}`}>
                      <Button variant="secondary">进入章节</Button>
                    </Link>
                    <Link href={`/novels/${novel.id}/edit`}>
                      <Button variant="ghost">作品设置</Button>
                    </Link>
                  </div>
                </div>
              </Panel>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
