import { redirect } from "next/navigation";

import { getUser, listAllNovels, listImportJobs } from "@xu-novel/lib";
import { Panel } from "@xu-novel/ui";

import { AdminShell } from "../admin-shell";

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login?redirectedFrom=/dashboard");
  }

  const [novels, imports] = await Promise.all([listAllNovels(), listImportJobs()]);

  return (
    <AdminShell
      title="概览"
      subtitle="先打通作品、章节、发布和缓存刷新，再把阅读器与导入流程抬起来。"
    >
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["作品数量", String(novels.length)],
          ["导入队列", String(imports.length)],
          ["部署模式", "双应用 Vercel"],
        ].map(([label, value]) => (
          <Panel className="space-y-3 border-stone-800 bg-stone-900/70" key={label}>
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">{label}</p>
            <p className="font-serif text-4xl">{value}</p>
          </Panel>
        ))}
      </div>
    </AdminShell>
  );
}
