import { redirect } from "next/navigation";
import Link from "next/link";

import { getAdminUser, listImportJobs } from "@xu-novel/lib";
import { Button, Panel } from "@xu-novel/ui";

import { AdminShell } from "../admin-shell";
import { ImportDocxForm } from "./import-docx-form";

export default async function ImportsPage() {
  const user = await getAdminUser();
  if (!user) {
    redirect("/login?redirectedFrom=/imports");
  }

  const jobs = await listImportJobs();
  const pendingCount = jobs.filter((job) => job.status === "pending").length;
  const confirmedCount = jobs.filter((job) => job.status === "confirmed").length;
  const failedCount = jobs.filter((job) => job.status === "failed").length;

  return (
    <AdminShell
      title="导入"
      subtitle="导入链路不再只是上传按钮和一段原始 Markdown，而是一个从解析到成书的工作台。"
    >
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["导入总数", String(jobs.length)],
            ["待处理", String(pendingCount)],
            ["已生成", String(confirmedCount)],
            ["失败", String(failedCount)],
          ].map(([label, value]) => (
            <Panel className="space-y-3 border-stone-800 bg-stone-900/70" key={label}>
              <p className="text-xs uppercase tracking-[0.22em] text-stone-500">{label}</p>
              <p className="font-serif text-3xl tracking-tight">{value}</p>
            </Panel>
          ))}
        </div>

        <ImportDocxForm />

        <Panel className="space-y-5 border-stone-800 bg-stone-900/70">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">导入记录</p>
            <h3 className="font-serif text-3xl tracking-tight">继续处理现有导入</h3>
          </div>

          {jobs.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-stone-800 px-5 py-6 text-sm leading-7 text-stone-500">
              还没有导入记录。上传一个 `.docx` 后，这里会出现待处理任务。
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {jobs.map((job) => (
                <Panel
                  className="space-y-4 border-stone-800 bg-stone-950/70 transition hover:-translate-y-0.5 hover:border-stone-700"
                  key={job.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full border border-stone-700 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-stone-400">
                      {job.status === "confirmed"
                        ? "已生成"
                        : job.status === "failed"
                          ? "失败"
                          : "待处理"}
                    </span>
                    <span className="text-xs text-stone-500">
                      {Object.keys(job.image_manifest).length} 张图
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-serif text-2xl tracking-tight">{job.file_name}</h3>
                    <p className="line-clamp-4 text-sm leading-7 text-stone-400">
                      {job.error_message || job.converted_markdown}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link href={`/imports/${job.id}`}>
                      <Button variant="secondary">继续整理</Button>
                    </Link>
                    <Link href={`/imports/${job.id}`}>
                      <Button variant="ghost">打开详情</Button>
                    </Link>
                  </div>
                </Panel>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </AdminShell>
  );
}
