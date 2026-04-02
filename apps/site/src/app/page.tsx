import Link from "next/link";
import { redirect } from "next/navigation";

import { getSiteSettings, getUser, listPublishedNovels } from "@xu-novel/lib";
import { Badge, Button, Panel, SectionHeading } from "@xu-novel/ui";

export default async function HomePage() {
  const user = await getUser();
  if (user) {
    redirect("/library");
  }

  const [novels, settings] = await Promise.all([
    listPublishedNovels(),
    getSiteSettings(),
  ]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.12),transparent_24%),linear-gradient(180deg,#faf7f2,#f5efe4)] px-5 py-6 text-stone-900 md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-5 rounded-[2.2rem] border border-stone-200/80 bg-white/70 px-6 py-5 backdrop-blur md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.32em] text-stone-500">首页预览</p>
            <h1 className="font-serif text-4xl tracking-tight md:text-5xl">xu-novel</h1>
            <p className="max-w-2xl text-sm leading-7 text-stone-600 md:text-base">
              未登录用户现在只能浏览首页预览。作品详情、章节阅读和阅读设置都需要登录后进入。
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link href="/login">
              <Button variant="ghost">登录</Button>
            </Link>
            <Link href="/login#register">
              <Button variant="secondary">注册</Button>
            </Link>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Panel className="relative overflow-hidden space-y-8 border-stone-200/80 bg-[radial-gradient(circle_at_top,rgba(120,53,15,0.08),transparent_28%),linear-gradient(135deg,rgba(28,25,23,0.98),rgba(68,64,60,0.94))] text-stone-50">
            <div
              className="absolute inset-0 opacity-25"
              style={{
                backgroundImage: settings.homepage_background_url
                  ? `linear-gradient(180deg,rgba(28,25,23,0.18),rgba(28,25,23,0.72)),url(${settings.homepage_background_url})`
                  : undefined,
                backgroundPosition: "center",
                backgroundSize: "cover",
              }}
            />
            <div className="relative space-y-5">
              <Badge className="border-stone-500/40 text-stone-300">
                {settings.hero_eyebrow ?? "私人阅读室"}
              </Badge>
              <div className="space-y-4">
                <h2 className="max-w-3xl font-serif text-5xl leading-none tracking-tight md:text-7xl">
                  {settings.hero_title ?? "首页只做预览，阅读入口留给登录后的书库。"}
                </h2>
                <p className="max-w-2xl text-base leading-8 text-stone-300 md:text-lg">
                  {settings.brand_line ??
                    "封面、氛围和文案会展示在首页，但真正的作品详情、章节目录和阅读器只对已登录用户开放。"}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/login">
                  <Button className="bg-stone-100 text-stone-950 hover:bg-stone-200">
                    登录后进入书库
                  </Button>
                </Link>
                <Link href="/login#register">
                  <Button variant="secondary">邮箱注册</Button>
                </Link>
              </div>
            </div>
          </Panel>

          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
            {[
              ["访问范围", "未登录仅首页预览"],
              ["注册方式", "邮箱 + 验证码"],
              ["阅读入口", "登录后进入作品与章节"],
            ].map(([label, value]) => (
              <Panel className="space-y-3" key={label}>
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">{label}</p>
                <p className="font-serif text-2xl tracking-tight">{value}</p>
              </Panel>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <SectionHeading
            eyebrow="预览书架"
            title="已发布作品预览"
            description="这里展示封面与摘要，但未登录状态下不会进入作品详情和章节阅读。"
          />
          {novels.length === 0 ? (
            <Panel className="border-dashed border-stone-300/80 bg-white/65 text-sm leading-7 text-stone-600">
              目前还没有已发布作品可供预览。登录后台发布作品后，首页会自动更新。
            </Panel>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {novels.map((novel) => (
                <Panel className="space-y-4 border-stone-200/80 bg-white/78" key={novel.id}>
                  <div
                    className="relative aspect-[4/5] overflow-hidden rounded-[1.6rem] bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${novel.cover_url ?? settings.homepage_background_url ?? ""})`,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/65 via-stone-950/10 to-transparent" />
                    <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3">
                      <Badge className="border-white/30 bg-white/10 text-white">{novel.status}</Badge>
                      <span className="rounded-full bg-white/12 px-3 py-1 text-xs uppercase tracking-[0.22em] text-white">
                        登录后阅读
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-serif text-2xl tracking-tight">{novel.title}</h3>
                    <p className="text-sm leading-7 text-stone-600">{novel.summary}</p>
                  </div>
                </Panel>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
