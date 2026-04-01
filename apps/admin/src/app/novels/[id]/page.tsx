import { notFound, redirect } from "next/navigation";

import { getNovelById, getUser, listChaptersForNovel } from "@xu-novel/lib";

import { AdminShell } from "../../admin-shell";
import { saveChapterAction } from "../actions";
import { ChapterManager } from "./chapter-manager";

export default async function NovelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) {
    redirect("/login?redirectedFrom=/novels");
  }

  const { id } = await params;
  const novel = await getNovelById(id);
  if (!novel) notFound();

  const chapters = await listChaptersForNovel(novel.id);

  return (
    <AdminShell
      title={
        <div className="flex items-center gap-4">
          <span>{novel.title}</span>
          <a href={`/novels/${novel.id}/edit`} className="text-sm border border-stone-700 hover:bg-stone-800 text-stone-300 rounded-full px-3 py-1 font-sans">
            设置作品
          </a>
        </div>
      }
      subtitle="点击右侧章节切换编辑，或新建章节。支持快捷键与 Word 粘贴。"
    >
      <ChapterManager
        novelId={novel.id}
        chapters={chapters}
        saveAction={saveChapterAction}
      />
    </AdminShell>
  );
}
