import Link from "next/link";
import { notFound } from "next/navigation";

import { getNovelBySlug, listChaptersForNovel } from "@xu-novel/lib";
import { Badge, Button, Panel, SectionHeading } from "@xu-novel/ui";

import { SiteShell } from "../../site-shell";

export default async function NovelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const novel = await getNovelBySlug(slug);

  if (!novel) notFound();

  const chapters = (await listChaptersForNovel(novel.id)).filter(
    (chapter) => chapter.status === "published",
  );
  const totalWords = chapters.reduce((sum, chapter) => sum + chapter.word_count, 0);
  const estimatedHours = Math.max(1, Math.ceil(totalWords / 12000));
  const firstChapter = chapters[0] ?? null;

  return (
    <SiteShell heading="作品" subheading={novel.summary ?? "进入目录后，可以从任意章节开始阅读。"}>
      <section className="overflow-hidden rounded-[2.6rem] border border-stone-200/70 bg-stone-950 text-stone-50 shadow-[0_30px_80px_-50px_rgba(24,24,27,0.55)]">
        <div
          className="relative min-h-[34rem] overflow-hidden px-6 py-6 sm:px-8 sm:py-8"
          style={{
            backgroundImage: `linear-gradient(120deg,rgba(10,10,10,0.82),rgba(10,10,10,0.42)), url(${novel.backdrop_url ?? novel.cover_url ?? ""})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.16),transparent_32%)]" />
          <div className="relative grid gap-8 xl:grid-cols-[220px_minmax(0,1fr)_280px] xl:items-end">
            <div
              className="aspect-[4/5] rounded-[2rem] border border-white/10 bg-cover bg-center shadow-[0_35px_80px_-45px_rgba(0,0,0,0.65)]"
              style={{
                backgroundImage: `url(${novel.cover_url ?? novel.backdrop_url ?? ""})`,
              }}
            />

            <div className="space-y-5">
              <Badge className="border-white/20 bg-white/10 text-white">{novel.status}</Badge>
              <div className="space-y-4">
                <h1 className="max-w-[12ch] font-serif text-4xl leading-[0.92] tracking-tight sm:text-6xl">
                  {novel.title}
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-stone-300 sm:text-base sm:leading-8">
                  {novel.summary || "这部作品还没有填写简介，但章节已经可以进入阅读。"}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {firstChapter ? (
                  <Link href={`/novel/${novel.slug}/chapter/${firstChapter.slug}`}>
                    <Button>从第一章开始</Button>
                  </Link>
                ) : null}
                <Link href="#chapter-list">
                  <Button variant="secondary">查看目录</Button>
                </Link>
              </div>
            </div>

            <div className="grid gap-3">
              {[
                ["已发布章节", String(chapters.length)],
                ["总字数", totalWords.toLocaleString("zh-CN")],
                ["预计时长", `${estimatedHours} 小时`],
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
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel className="space-y-6 paper-noise" id="chapter-list">
          <SectionHeading
            eyebrow="目录"
            title="章节顺序"
            description="从这里直接进入阅读，不需要先经过一个多余的中间层。"
          />
          <div className="space-y-3">
            {chapters.length > 0 ? (
              chapters.map((chapter, index) => (
                <Link
                  className="group flex items-center justify-between gap-4 rounded-[1.75rem] border border-stone-300/70 bg-white/60 px-5 py-4 transition hover:-translate-y-0.5 hover:border-stone-500 hover:bg-white"
                  href={`/novel/${novel.slug}/chapter/${chapter.slug}`}
                  key={chapter.id}
                >
                  <div className="min-w-0 space-y-1">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-stone-500">
                      第 {index + 1} 章
                    </p>
                    <h3 className="truncate font-serif text-2xl tracking-tight">{chapter.title}</h3>
                    <p className="text-sm text-stone-600">
                      {chapter.word_count.toLocaleString("zh-CN")} 字
                    </p>
                  </div>
                  <span className="text-sm text-stone-500 transition group-hover:translate-x-1 group-hover:text-stone-900">
                    开始阅读
                  </span>
                </Link>
              ))
            ) : (
              <div className="rounded-[1.75rem] border border-dashed border-stone-300/80 px-5 py-6 text-sm leading-7 text-stone-600">
                这部作品暂时还没有已发布章节。
              </div>
            )}
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel tone="ink" className="space-y-4">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-400">阅读建议</p>
            <h2 className="font-serif text-3xl tracking-tight">进入方式</h2>
            <div className="space-y-3 text-sm leading-7 text-stone-300">
              <p>如果你是第一次读，建议从第一章开始，阅读器会自动记录位置。</p>
              <p>如果是回来续读，下一次可以直接从书库里的“继续阅读”回到断点。</p>
            </div>
          </Panel>

          <Panel className="space-y-4">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">这页现在负责</p>
            <div className="space-y-3 text-sm leading-7 text-stone-600 dark:text-stone-300">
              <p>先用大图和基础信息建立作品气质。</p>
              <p>再把目录做成真正的阅读入口，而不是一行行平铺文本。</p>
              <p>把章节体量和预计时长提前告诉读者，减少试错感。</p>
            </div>
          </Panel>
        </div>
      </section>
    </SiteShell>
  );
}
