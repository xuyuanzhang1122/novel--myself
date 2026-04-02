import type { LatestReadingRecord } from "@xu-novel/lib";
import Link from "next/link";

import { getLatestReadingHistory, getSiteSettings, getUser, listPublishedNovels } from "@xu-novel/lib";
import { Badge, Panel, PosterHero, SectionHeading } from "@xu-novel/ui";

import { SiteShell } from "../site-shell";

function getContinueHref(history: LatestReadingRecord | null, firstNovelSlug?: string) {
  if (history) {
    return `/novel/${history.novel_slug}/chapter/${history.chapter_slug}`;
  }

  return firstNovelSlug ? `/novel/${firstNovelSlug}` : "/library";
}

export default async function LibraryPage() {
  const user = await getUser();
  const [novels, settings, latestReading] = await Promise.all([
    listPublishedNovels(),
    getSiteSettings(),
    user ? getLatestReadingHistory(user.id) : Promise.resolve(null),
  ]);
  const continueHref = getContinueHref(latestReading, novels[0]?.slug);
  const continueProgress =
    latestReading && typeof latestReading.fallback_progress === "number"
      ? `${Math.round(latestReading.fallback_progress * 100)}%`
      : null;

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
        primaryActionHref={continueHref}
        secondaryActionLabel={settings.hero_secondary_action ?? "阅读设置"}
        secondaryActionHref="/settings"
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
            {latestReading ? (
              <div className="space-y-3 text-sm leading-7 text-stone-300">
                <p>
                  正在阅读《{latestReading.novel_title}》的《{latestReading.chapter_title}》。
                  {continueProgress ? ` 当前记录进度约 ${continueProgress}。` : ""}
                </p>
                <Link
                  className="inline-flex rounded-full border border-stone-700 px-4 py-2 text-sm text-stone-100 transition hover:border-stone-500 hover:bg-stone-800"
                  href={continueHref}
                >
                  继续阅读
                </Link>
              </div>
            ) : (
              <div className="space-y-3 text-sm leading-7 text-stone-300">
                <p>还没有阅读记录。打开一本已发布作品后，这里会自动回到你上次停下的位置。</p>
                {novels[0] ? (
                  <Link
                    className="inline-flex rounded-full border border-stone-700 px-4 py-2 text-sm text-stone-100 transition hover:border-stone-500 hover:bg-stone-800"
                    href={`/novel/${novels[0].slug}`}
                  >
                    打开第一本作品
                  </Link>
                ) : null}
              </div>
            )}
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
