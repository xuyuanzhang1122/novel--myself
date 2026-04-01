import Link from "next/link";
import { notFound } from "next/navigation";

import { getNovelBySlug, listChaptersForNovel } from "@xu-novel/lib";
import { Badge, Button, Panel, SectionHeading } from "@xu-novel/ui";

import { SiteShell } from "../../site-shell";

export default async function NovelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const novel = await getNovelBySlug(slug);

  if (!novel) notFound();

  const chapters = (await listChaptersForNovel(novel.id)).filter((chapter) => chapter.status === "published");

  return (
    <SiteShell heading="作品" subheading={novel.summary ?? undefined}>
      <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div
          className="min-h-[28rem] rounded-[2.5rem] bg-cover bg-center shadow-[0_30px_80px_-40px_rgba(0,0,0,0.7)]"
          style={{ backgroundImage: `url(${novel.backdrop_url ?? novel.cover_url ?? ""})` }}
        />
        <Panel className="space-y-8 paper-noise">
          <div className="space-y-4">
            <Badge>{novel.status}</Badge>
            <SectionHeading title={novel.title} description={novel.summary ?? undefined} eyebrow="概览" />
          </div>
          <div className="space-y-4">
            {chapters.map((chapter) => (
              <Link
                href={`/novel/${novel.slug}/chapter/${chapter.slug}`}
                key={chapter.id}
                className="flex items-center justify-between rounded-[1.75rem] border border-stone-300/70 px-5 py-4 transition hover:border-stone-500"
              >
                <div className="space-y-1">
                  <h3 className="font-serif text-xl">{chapter.title}</h3>
                  <p className="text-sm text-stone-600">{chapter.word_count} 字</p>
                </div>
                <Button variant="ghost">开始阅读</Button>
              </Link>
            ))}
          </div>
        </Panel>
      </section>
    </SiteShell>
  );
}
