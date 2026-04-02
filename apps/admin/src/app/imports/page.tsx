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

  return (
    <AdminShell title="导入" subtitle="导入链路默认在浏览器端解析 `.docx`，后台只接收清洗后的结果。">
      <div className="space-y-6">
        <ImportDocxForm />
        <div className="grid gap-4">
          {jobs.map((job) => (
            <Panel className="space-y-3 border-stone-800 bg-stone-900/70" key={job.id}>
              <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
                {job.status === "confirmed" ? "已生成" : job.status === "failed" ? "失败" : "待处理"}
              </p>
              <h3 className="font-serif text-2xl">{job.file_name}</h3>
              <p className="line-clamp-3 text-sm text-stone-400">{job.converted_markdown}</p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link href={`/imports/${job.id}`}>
                  <Button variant="secondary">编辑并生成作品</Button>
                </Link>
              </div>
            </Panel>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
