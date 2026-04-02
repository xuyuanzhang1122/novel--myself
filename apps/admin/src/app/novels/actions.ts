"use server";

import { redirect } from "next/navigation";

import { revalidatePath, revalidateTag } from "next/cache";

import {
  prisma,
  estimateWordCount,
  getAdminUser,
  getCacheTagsForNovel,
  getNovelById,
  listChaptersForNovel,
  markdownToHtml,
  novelCacheTag,
  novelListTag,
  siteSettingsTag,
  triggerSiteRevalidation,
} from "@xu-novel/lib";

import type { AdminActionResult } from "../action-result";
import { parseChapterInput, parseNovelInput } from "../../lib/validation";

export async function saveNovelAction(formData: FormData): Promise<AdminActionResult> {
  const user = await getAdminUser();
  if (!user) {
    redirect("/login?redirectedFrom=/novels");
  }

  const input = parseNovelInput(formData);
  const { id, ...rest } = input;

  try {
    const existingNovel = id ? await getNovelById(id) : null;

    if (id) {
      await prisma.novel.update({
        where: { id },
        data: {
          title: rest.title,
          slug: rest.slug,
          summary: rest.summary,
          coverUrl: rest.cover_url,
          backdropUrl: rest.backdrop_url,
          status: rest.status,
          sortOrder: rest.sort_order,
        },
      });
    } else {
      await prisma.novel.create({
        data: {
          title: rest.title,
          slug: rest.slug,
          summary: rest.summary,
          coverUrl: rest.cover_url,
          backdropUrl: rest.backdrop_url,
          status: rest.status,
          sortOrder: rest.sort_order,
        },
      });
    }

    await triggerSiteRevalidation([
      ...(existingNovel && existingNovel.slug !== rest.slug
        ? [novelCacheTag(existingNovel.slug)]
        : []),
      novelCacheTag(rest.slug),
      novelListTag(),
      siteSettingsTag(),
    ]);
    
    // Clear admin cache so changes reflect instantly.
    if (existingNovel && existingNovel.slug !== rest.slug) {
      revalidateTag(novelCacheTag(existingNovel.slug));
    }
    revalidateTag(novelCacheTag(rest.slug));
    revalidateTag(novelListTag());
    revalidatePath("/novels");
  } catch (error: any) {
    throw new Error(`保存失败：${error.message}`);
  }

  return {
    ok: true,
    message: id ? "作品已更新。" : "作品已创建。",
  };
}

export async function saveChapterAction(formData: FormData): Promise<AdminActionResult> {
  const user = await getAdminUser();
  if (!user) {
    redirect("/login?redirectedFrom=/novels");
  }

  const input = parseChapterInput(formData);
  const { id, ...rest } = input;

  try {
    const htmlCache = await markdownToHtml(rest.markdown_content);
    const wordCount = estimateWordCount(rest.markdown_content);
    const savedChapter = id
      ? await prisma.chapter.update({
          where: { id },
          data: {
            novelId: rest.novel_id,
            title: rest.title,
            slug: rest.slug,
            markdownContent: rest.markdown_content,
            htmlCache,
            wordCount,
            chapterOrder: rest.chapter_order,
            status: rest.status,
          },
        })
      : await prisma.chapter.create({
          data: {
            novelId: rest.novel_id,
            title: rest.title,
            slug: rest.slug,
            markdownContent: rest.markdown_content,
            htmlCache,
            wordCount,
            chapterOrder: rest.chapter_order,
            status: rest.status,
          },
        });

    const novel = await getNovelById(input.novel_id);
    if (!novel) {
      throw new Error("作品不存在。");
    }

    const chapters = await listChaptersForNovel(novel.id);
    const tags = getCacheTagsForNovel(
      novel.id,
      novel.slug,
      chapters.map((chapter) => chapter.slug),
    );
    await triggerSiteRevalidation(tags);

    tags.forEach((tag) => revalidateTag(tag));
    revalidatePath(`/novels/${input.novel_id}`);

    return {
      ok: true,
      chapterId: savedChapter.id,
      message: id ? "章节已更新。" : "章节已创建。",
    };
  } catch (error: any) {
    throw new Error(`保存失败：${error.message}`);
  }
}

export async function deleteNovelAction(id: string) {
  const user = await getAdminUser();
  if (!user) {
    redirect("/login?redirectedFrom=/novels");
  }

  try {
    const novel = await getNovelById(id);
    if (!novel) return;

    const chapters = await listChaptersForNovel(id);
    await prisma.novel.delete({ where: { id } });

    await triggerSiteRevalidation(
      getCacheTagsForNovel(id, novel.slug, chapters.map((c) => c.slug))
    );
    
    revalidateTag(novelListTag());
    revalidateTag(novelCacheTag(novel.slug));
    revalidatePath("/novels");
    
  } catch (error: any) {
    throw new Error(`删除失败：${error.message}`);
  }
}
