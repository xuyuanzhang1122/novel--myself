import Link from "next/link";

import { listPublishedNovels, getSiteSettings } from "@xu-novel/lib";
import { Badge, Panel, PosterHero, SectionHeading } from "@xu-novel/ui";

import { SiteShell } from "../site-shell";

export default async function LibraryPage() {
  const [novels, settings] = await Promise.all([
    listPublishedNovels(),
    getSiteSettings(),
  ]);

  return (
    <SiteShell
      heading="书库"
      subheading="封面、背景与阅读进度在这里汇合成你的私人书库。"
    >
      <PosterHero
        eyebrow={settings.hero_eyebrow ?? "阅读空间"}
        title={settings.hero_title ?? "给长章节与未完稿准备的私家书架。"}
        description={
          settings.brand_line ??
          "在同一主域下维持沉浸阅读与后台管理的双重节奏。"
        }
        primaryActionLabel={settings.hero_primary_action ?? "继续阅读"}
        secondaryActionLabel={settings.hero_secondary_action ?? "打开后台"}
      />

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Panel className="space-y-6 paper-noise">
          <SectionHeading
            eyebrow="书架"
            title="已发布作品"
            description="前台只展示已发布章节。草稿与下线内容保留在后台，不进入阅读视野。"
          />
          {novels.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-stone-300/80 px-6 py-8 text-sm leading-7 text-stone-600">
              书库里还没有已发布作品。去后台把作品状态改成“已发布”后，这里会自动刷新显示。
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {novels.map((novel) => (
                <Link
                  className="group space-y-4 rounded-[2rem] border border-stone-300/70 p-4 transition hover:-translate-y-1 hover:border-stone-500"
                  href={`/novel/${novel.slug}`}
                  key={novel.id}
                >
                  <div
                    className="aspect-[4/5] rounded-[1.5rem] bg-cover bg-center shadow-[0_25px_50px_-30px_rgba(0,0,0,0.5)]"
                    style={{
                      backgroundImage: `url(${novel.cover_url ?? settings.homepage_background_url ?? ""})`,
                    }}
                  />
                  <div className="space-y-2">
                    <Badge>{novel.status}</Badge>
                    <h3 className="font-serif text-2xl">{novel.title}</h3>
                    <p className="text-sm leading-7 text-stone-600">
                      {novel.summary}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel tone="ink" className="space-y-4">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-400">
              继续阅读
            </p>
            <h2 className="font-serif text-3xl">最近阅读</h2>
            <p className="text-sm leading-7 text-stone-300">
              v1
              通过段落锚点与百分比双重记录阅读进度，章节更新后仍能回到合理位置。
            </p>
          </Panel>
          <Panel className="space-y-4">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
              氛围
            </p>
            <p className="text-sm leading-7 text-stone-600 dark:text-stone-300">
              页面采用纸张噪点、深色墨面与封面感布局，不走通用卡片栅格。
            </p>
          </Panel>
        </div>
      </section>
    </SiteShell>
  );
}
