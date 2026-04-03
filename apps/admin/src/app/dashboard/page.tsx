import Link from "next/link";
import { redirect } from "next/navigation";

import { getAdminUser, listAllNovels, listImportJobs } from "@xu-novel/lib";
import { Panel } from "@xu-novel/ui";

import { AdminShell } from "../admin-shell";

export default async function DashboardPage() {
  const user = await getAdminUser();
  if (!user) {
    redirect("/login?redirectedFrom=/dashboard");
  }

  const [novels, imports] = await Promise.all([listAllNovels(), listImportJobs()]);
  const publishedCount = novels.filter((item) => item.status === "published").length;
  const draftCount = novels.filter((item) => item.status === "draft").length;
  const pendingImports = imports.filter((item) => item.status === "pending").length;

  return (
    <AdminShell
      title="概览"
      subtitle="把作品、导入和发布节奏放到同一屏里，先看得到问题，再进入具体页面处理。"
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_0.85fr]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              ["作品总数", String(novels.length), "所有状态"],
              ["已发布", String(publishedCount), "前台可见"],
              ["草稿中", String(draftCount), "待整理"],
              ["待处理导入", String(pendingImports), "待确认"],
            ].map(([label, value, note]) => (
              <Panel className="space-y-3 border-stone-800 bg-stone-900/70" key={label}>
                <p className="text-xs uppercase tracking-[0.22em] text-stone-500">{label}</p>
                <p className="font-serif text-4xl">{value}</p>
                <p className="text-sm text-stone-500">{note}</p>
              </Panel>
            ))}
          </div>

          <Panel className="space-y-4 border-stone-800 bg-stone-900/70">
            <div className="flex items-end justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.28em] text-stone-500">最近作品</p>
                <h3 className="font-serif text-3xl tracking-tight">继续编辑</h3>
              </div>
              <Link className="text-sm text-stone-400 transition hover:text-stone-100" href="/novels">
                查看全部
              </Link>
            </div>
            <div className="space-y-3">
              {novels.slice(0, 6).map((novel) => (
                <Link
                  className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-stone-800 bg-stone-950/70 px-4 py-4 transition hover:-translate-y-0.5 hover:border-stone-700 hover:bg-stone-900"
                  href={`/novels/${novel.id}`}
                  key={novel.id}
                >
                  <div className="min-w-0">
                    <p className="truncate font-serif text-xl tracking-tight text-stone-100">{novel.title}</p>
                    <p className="mt-1 truncate text-sm text-stone-500">{novel.summary || "还没有填写简介。"}</p>
                  </div>
                  <span className="rounded-full border border-stone-700 px-3 py-1 text-xs uppercase tracking-[0.2em] text-stone-400">
                    {novel.status}
                  </span>
                </Link>
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel className="space-y-4 border-stone-800 bg-stone-900/70">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.28em] text-stone-500">导入队列</p>
              <h3 className="font-serif text-3xl tracking-tight">最近导入</h3>
            </div>
            <div className="space-y-3">
              {imports.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-stone-800 px-4 py-5 text-sm text-stone-500">
                  暂时没有导入任务。
                </div>
              ) : (
                imports.slice(0, 5).map((job) => (
                  <Link
                    className="block rounded-[1.5rem] border border-stone-800 bg-stone-950/70 px-4 py-4 transition hover:-translate-y-0.5 hover:border-stone-700 hover:bg-stone-900"
                    href={`/imports/${job.id}`}
                    key={job.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-stone-100">{job.file_name}</p>
                        <p className="mt-1 text-xs text-stone-500">
                          {job.error_message || "等待确认章节结构与图片。"}
                        </p>
                      </div>
                      <span className="rounded-full border border-stone-700 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-stone-400">
                        {job.status}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Panel>

          <Panel className="space-y-4 border-stone-800 bg-stone-900/70">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.28em] text-stone-500">下一步</p>
              <h3 className="font-serif text-3xl tracking-tight">建议动作</h3>
            </div>
            <div className="space-y-3 text-sm leading-7 text-stone-300">
              <p>先把草稿作品整理成可发布状态，再回到前台检视阅读体验。</p>
              <p>如果导入队列积压，优先处理 pending 项，避免编辑器里继续手工返工。</p>
              <p>需要控制账号风险时，直接去用户页重置密码或收回管理员权限。</p>
            </div>
          </Panel>
        </div>
      </div>
    </AdminShell>
  );
}
