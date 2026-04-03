import type { LatestReadingRecord } from "@xu-novel/lib";
import Link from "next/link";

import {
  getLatestReadingHistory,
  getSiteSettings,
  getUser,
  listPublishedNovels,
} from "@xu-novel/lib";
import { Badge, Panel, SectionHeading } from "@xu-novel/ui";

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
  const featuredNovel = novels[0] ?? null;

  return (
    <SiteShell heading="书库" subheading="现在它更像一间可进入的阅读空间，而不是一排普通卡片。">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
        <div className="overflow-hidden rounded-[2.6rem] border border-stone-200/70 bg-stone-950 text-stone-50 shadow-[0_30px_80px_-50px_rgba(24,24,27,0.55)]">
          <div
            className="relative min-h-[28rem] overflow-hidden px-6 py-6 sm:px-8 sm:py-8"
            style={{
              backgroundImage: `linear-gradient(125deg,rgba(10,10,10,0.86),rgba(10,10,10,0.55)), url(${featuredNovel?.backdrop_url ?? featuredNovel?.cover_url ?? settings.homepage_background_url ?? ""})`,
              backgroundPosition: "center",
              backgroundSize: "cover",
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.16),transparent_30%)]" />
            <div className="relative flex h-full flex-col justify-between gap-8">
              <div className="space-y-4">
                <p className="text-[11px] uppercase tracking-[0.35em] text-stone-300">
                  {settings.hero_eyebrow ?? "私人书库"}
                </p>
                <div className="space-y-3">
                  <h1 className="max-w-[10ch] font-serif text-4xl leading-[0.92] tracking-tight sm:text-6xl">
                    {settings.hero_title ?? "把正在读和接下来要读的，都留在视线里。"}
                  </h1>
                  <p className="max-w-xl text-sm leading-7 text-stone-300 sm:text-base sm:leading-8">
                    {settings.brand_line ??
                      "继续阅读、切换作品和管理阅读节奏，都应该像翻开书架而不是点进一个普通列表。"}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
                <div className="rounded-[1.8rem] border border-white/10 bg-black/25 px-5 py-5 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.24em] text-stone-400">本次入口</p>
                  {latestReading ? (
                    <div className="mt-3 space-y-3">
                      <p className="font-serif text-3xl tracking-tight">{latestReading.novel_title}</p>
                      <p className="text-sm leading-7 text-stone-300">
                        当前停在《{latestReading.chapter_title}》。
                        {continueProgress ? ` 已读约 ${continueProgress}。` : ""}
                      </p>
                      <Link
                        className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-stone-50 transition hover:bg-white/15"
                        href={continueHref}
                      >
                        {settings.hero_primary_action ?? "继续阅读"}
                      </Link>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-3">
                      <p className="font-serif text-3xl tracking-tight">
                        {featuredNovel?.title ?? "等待第一本作品"}
                      </p>
                      <p className="text-sm leading-7 text-stone-300">
                        还没有阅读记录。先选一本作品，后面这里会自动回到你停下的位置。
                      </p>
                      {featuredNovel ? (
                        <Link
                          className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-stone-50 transition hover:bg-white/15"
                          href={`/novel/${featuredNovel.slug}`}
                        >
                          打开第一本作品
                        </Link>
                      ) : null}
                    </div>
                  )}
                </div>

                <div className="grid gap-3">
                  {[
                    ["已发布作品", String(novels.length)],
                    ["最近进度", continueProgress ?? "0%"],
                    ["默认主题", settings.default_theme ?? "paper"],
                  ].map(([label, value]) => (
                    <div
                      className="rounded-[1.5rem] border border-white/10 bg-black/25 px-4 py-4 backdrop-blur"
                      key={label}
                    >
                      <p className="text-[11px] uppercase tracking-[0.24em] text-stone-400">{label}</p>
                      <p className="mt-3 font-serif text-3xl tracking-tight">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Panel tone="ink" className="space-y-4">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-400">阅读状态</p>
            <h2 className="font-serif text-3xl tracking-tight">最近阅读</h2>
            {latestReading ? (
              <div className="space-y-4 text-sm leading-7 text-stone-300">
                <p>
                  正在阅读《{latestReading.novel_title}》的《{latestReading.chapter_title}》。
                </p>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-amber-300/75"
                    style={{
                      width: continueProgress ?? "0%",
                    }}
                  />
                </div>
                <Link
                  className="inline-flex rounded-full border border-stone-700 px-4 py-2 text-sm text-stone-100 transition hover:border-stone-500 hover:bg-stone-800"
                  href={continueHref}
                >
                  继续阅读
                </Link>
              </div>
            ) : (
              <div className="space-y-3 text-sm leading-7 text-stone-300">
                <p>还没有阅读记录。进入任意一部已发布作品后，这里会开始追踪你的阅读位置。</p>
              </div>
            )}
          </Panel>

          <Panel className="space-y-4">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">这次优化</p>
            <div className="space-y-3 text-sm leading-7 text-stone-600 dark:text-stone-300">
              <p>继续阅读被提到首屏，不再埋在列表下面。</p>
              <p>作品入口改成封面导向和书架式排列，而不是通用卡片栅格。</p>
              <p>书库页开始承担“回到阅读”和“发现下一本”的双重角色。</p>
            </div>
          </Panel>
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading
          eyebrow="书架"
          title="已发布作品"
          description="每一本作品都保留自己的封面气质、简介和阅读入口。"
        />

        {novels.length === 0 ? (
          <Panel className="rounded-[2rem] border-dashed border-stone-300/80 px-6 py-8 text-sm leading-7 text-stone-600">
            书库里还没有已发布作品。去后台把作品状态改成“已发布”后，这里会自动刷新显示。
          </Panel>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {novels.map((novel, index) => (
              <Link
                className="group overflow-hidden rounded-[2.1rem] border border-stone-200/70 bg-white/78 transition hover:-translate-y-1 hover:border-stone-500 hover:shadow-[0_28px_70px_-42px_rgba(24,24,27,0.45)] dark:border-stone-800/80 dark:bg-stone-950/65"
                href={`/novel/${novel.slug}`}
                key={novel.id}
              >
                <div
                  className="relative aspect-[5/4] bg-cover bg-center"
                  style={{
                    backgroundImage: `linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.72)), url(${novel.backdrop_url ?? novel.cover_url ?? settings.homepage_background_url ?? ""})`,
                  }}
                >
                  <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 py-5">
                    <Badge className="border-white/20 bg-black/20 text-white">{novel.status}</Badge>
                    <span className="text-[11px] uppercase tracking-[0.24em] text-stone-200">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 px-5 py-5 text-white">
                    <p className="font-serif text-3xl tracking-tight">{novel.title}</p>
                  </div>
                </div>
                <div className="space-y-4 px-5 py-5">
                  <p className="text-sm leading-7 text-stone-600 dark:text-stone-300">
                    {novel.summary || "这本作品还没有填写简介。"}
                  </p>
                  <div className="flex items-center justify-between text-sm text-stone-500 dark:text-stone-400">
                    <span>打开作品页</span>
                    <span className="transition group-hover:translate-x-1">进入</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </SiteShell>
  );
}
