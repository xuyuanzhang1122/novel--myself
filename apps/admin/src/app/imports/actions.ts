"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";

import {
  estimateWordCount,
  getCacheTagsForNovel,
  getAdminUser,
  markdownToHtml,
  prisma,
  triggerSiteRevalidation,
} from "@xu-novel/lib";

import type { AdminActionResult } from "../action-result";

function readField(formData: FormData, name: string) {
  return formData.get(name)?.toString().trim() ?? "";
}

export async function saveImportJobAction(payload: {
  fileName: string;
  convertedMarkdown: string;
  imageManifest: Record<string, string>;
  sourceDocUrl?: string | null;
}) {
  const user = await getAdminUser();
  if (!user) {
    redirect("/login?redirectedFrom=/imports");
  }

  try {
    await prisma.importJob.create({
      data: {
        fileName: payload.fileName,
        sourceDocUrl: payload.sourceDocUrl ?? null,
        convertedMarkdown: payload.convertedMarkdown,
        imageManifest: JSON.stringify(payload.imageManifest),
        status: "pending",
      }
    });
    return { ok: true };
  } catch (error: any) {
    throw new Error(`保存失败：${error.message}`);
  }
}

export async function createNovelFromImportAction(formData: FormData): Promise<AdminActionResult> {
  const user = await getAdminUser();
  if (!user) {
    redirect("/login?redirectedFrom=/imports");
  }

  const importJobId = readField(formData, "import_job_id");
  const title = readField(formData, "title");
  const slug = readField(formData, "slug");
  const summary = readField(formData, "summary");
  const coverUrl = readField(formData, "cover_url");
  const backdropUrl = readField(formData, "backdrop_url");
  const novelStatus = readField(formData, "status") || "published";
  const chapterCount = parseInt(readField(formData, "chapter_count") || "0", 10);

  if (!importJobId || !title || !slug || chapterCount < 1) {
    throw new Error("请把作品信息和章节内容填写完整。");
  }

  // Collect all chapters from form data
  const chaptersInput: { title: string; slug: string; content: string }[] = [];
  for (let i = 0; i < chapterCount; i++) {
    const chTitle = readField(formData, `chapter_title_${i}`);
    const chSlug = readField(formData, `chapter_slug_${i}`);
    const chContent = formData.get(`chapter_content_${i}`)?.toString() ?? "";
    if (!chTitle || !chSlug || !chContent) {
      throw new Error(`第 ${i + 1} 章信息不完整，请检查标题、slug 和内容。`);
    }
    chaptersInput.push({ title: chTitle, slug: chSlug, content: chContent });
  }

  let novelId: string;
  try {
    // Pre-compute HTML for all chapters
    const chapterData = await Promise.all(
      chaptersInput.map(async (ch, i) => ({
        ...ch,
        htmlCache: await markdownToHtml(ch.content),
        wordCount: estimateWordCount(ch.content),
        chapterOrder: i + 1,
      })),
    );

    const result = await prisma.$transaction(async (tx) => {
      const novel = await tx.novel.create({
        data: {
          title,
          slug,
          summary: summary || null,
          coverUrl: coverUrl || null,
          backdropUrl: backdropUrl || null,
          status: novelStatus,
          sortOrder: 1,
        },
      });

      const chapters = await Promise.all(
        chapterData.map((ch) =>
          tx.chapter.create({
            data: {
              novelId: novel.id,
              title: ch.title,
              slug: ch.slug,
              markdownContent: ch.content,
              htmlCache: ch.htmlCache,
              wordCount: ch.wordCount,
              chapterOrder: ch.chapterOrder,
              status: novelStatus,
            },
          }),
        ),
      );

      // Combine all chapter markdown for storage
      const fullMarkdown = chaptersInput
        .map((ch) => ch.content)
        .join("\n\n---\n\n");

      await tx.importJob.update({
        where: { id: importJobId },
        data: {
          convertedMarkdown: fullMarkdown,
          status: "confirmed",
          errorMessage: null,
        },
      });

      return { novel, chapters };
    });

    const chapterSlugs = result.chapters.map((c) => c.slug);
    const tags = getCacheTagsForNovel(result.novel.id, result.novel.slug, chapterSlugs);
    await triggerSiteRevalidation(tags);
    tags.forEach((tag) => revalidateTag(tag));
    revalidatePath("/imports");
    revalidatePath(`/imports/${importJobId}`);
    revalidatePath("/novels");

    novelId = result.novel.id;
  } catch (error: any) {
    throw new Error(`生成作品失败：${error.message}`);
  }

  return {
    ok: true,
    message: "作品已生成。",
    redirectTo: `/novels/${novelId}`,
  };
}

export async function deleteImportJobAction(formData: FormData): Promise<AdminActionResult> {
  const user = await getAdminUser();
  if (!user) {
    redirect("/login?redirectedFrom=/imports");
  }

  const importJobId = readField(formData, "import_job_id");
  if (!importJobId) {
    throw new Error("缺少导入记录 ID。");
  }

  try {
    await prisma.importJob.delete({
      where: { id: importJobId },
    });
    revalidatePath("/imports");
  } catch (error: any) {
    throw new Error(`删除失败：${error.message}`);
  }

  return {
    ok: true,
    message: "导入记录已删除。",
    redirectTo: "/imports",
  };
}
