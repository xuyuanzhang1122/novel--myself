import { notFound, redirect } from "next/navigation";

import { getAdminUser, getNovelById } from "@xu-novel/lib";
import { Panel, Button } from "@xu-novel/ui";

import { AdminShell } from "../../../admin-shell";
import { FormWithError } from "../../../form-with-error";
import { ImageUploadField } from "../../../image-upload-field";
import { saveNovelAction } from "../../actions";
import { DeleteNovelButton } from "../../delete-button";

export default async function NovelEditPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getAdminUser();
  if (!user) {
    redirect("/login?redirectedFrom=/novels");
  }

  const { id } = await params;
  const novel = await getNovelById(id);
  if (!novel) notFound();

  return (
    <AdminShell title={`编辑作品：${novel.title}`} subtitle="在这里更改作品设置：排序、简介和状态。">
      <div className="grid gap-6 xl:grid-cols-[0.8fr_0.4fr]">
        <Panel className="space-y-5 border-stone-800 bg-stone-900/70 max-w-2xl">
          <h3 className="font-serif text-3xl">作品信息</h3>
          <p className="text-sm leading-7 text-stone-400">
            只有“已发布”状态会进入前台书库。修改后会自动刷新前台缓存。
          </p>
          <FormWithError action={saveNovelAction} className="grid gap-4">
            <input name="id" type="hidden" defaultValue={novel.id} />
            
            <label className="space-y-1">
              <span className="text-sm text-stone-400">标题</span>
              <input className="w-full rounded-2xl bg-stone-950 px-4 py-3" name="title" defaultValue={novel.title} placeholder="标题" required />
            </label>
            
            <label className="space-y-1">
              <span className="text-sm text-stone-400">URL 标识</span>
              <input className="w-full rounded-2xl bg-stone-950 px-4 py-3" name="slug" defaultValue={novel.slug} placeholder="例如 chang-an" required />
            </label>
            
            <label className="space-y-1">
              <span className="text-sm text-stone-400">简介</span>
              <textarea className="w-full min-h-24 rounded-3xl bg-stone-950 px-4 py-3" name="summary" defaultValue={novel.summary ?? ""} placeholder="简介" />
            </label>

            <ImageUploadField
              folder="novels/covers"
              helpText="重新上传后会覆盖当前封面地址。"
              initialValue={novel.cover_url}
              label="封面图片"
              name="cover_url"
              previewClassName="aspect-[4/5]"
            />

            <ImageUploadField
              folder="novels/backdrops"
              helpText="用于作品详情页背景。"
              initialValue={novel.backdrop_url}
              label="背景图片"
              name="backdrop_url"
            />

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm text-stone-400">发布状态</span>
                <select className="rounded-2xl bg-stone-950 px-4 py-3 w-full" name="status" defaultValue={novel.status}>
                  <option value="draft">草稿（前台不可见）</option>
                  <option value="published">已发布（前台可见）</option>
                  <option value="archived">已归档</option>
                </select>
              </label>
              
              <label className="space-y-1">
                <span className="text-sm text-stone-400">前台排序数值</span>
                <input
                  className="rounded-2xl bg-stone-950 px-4 py-3 w-full"
                  name="sort_order"
                  type="number"
                  placeholder="排序"
                  defaultValue={novel.sort_order}
                />
              </label>
            </div>
            
            <Button type="submit">更新作品</Button>
          </FormWithError>
        </Panel>

        <Panel className="space-y-5 border-red-900/50 bg-red-950/20 h-fit">
          <h3 className="font-serif text-3xl text-red-500">危险操作</h3>
          <p className="text-sm text-stone-400">
            删除作品将会不可逆地清除包含的所有章节和阅读记录。请谨慎操作。
          </p>
          <div className="pt-2">
            <DeleteNovelButton id={novel.id} />
          </div>
        </Panel>
      </div>
    </AdminShell>
  );
}
