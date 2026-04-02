import { unstable_cache } from "next/cache";

import {
  chapterCacheTag,
  chapterListTag,
  estimateWordCount,
  markdownToHtml,
  novelCacheTag,
  novelListTag,
  siteSettingsTag,
} from "./content";
import { prisma } from "./prisma";
import type {
  ChapterRecord,
  ImportJobRecord,
  LatestReadingRecord,
  NovelRecord,
  ReaderPreferenceRecord,
  ReadingHistoryRecord,
  SiteSettingsRecord,
} from "./types";
import type { PublishState } from "./types";

const defaultSettings: SiteSettingsRecord = {
  id: "default",
  homepage_background_url: null,
  brand_line: null,
  hero_eyebrow: null,
  hero_title: null,
  hero_primary_action: null,
  hero_secondary_action: null,
  default_theme: "paper",
  default_font: "serif",
  accent_hex: "#c08457"
};

export const defaultReaderPreference = {
  font_family: "serif" as const,
  font_scale: 1,
  page_width: "standard" as const,
  theme: "paper" as const,
  background_tone: null,
};

export async function getSiteSettings(): Promise<SiteSettingsRecord> {
  try {
    return await unstable_cache(
      async () => {
        const data = await prisma.siteSettings.findFirst();
        if (!data) return defaultSettings;
        return {
          id: data.id,
          homepage_background_url: data.homepageBackgroundUrl,
          brand_line: data.brandLine,
          hero_eyebrow: data.heroEyebrow,
          hero_title: data.heroTitle,
          hero_primary_action: data.heroPrimaryAction,
          hero_secondary_action: data.heroSecondaryAction,
          default_theme: (data.defaultTheme as "paper" | "night" | "mist") || "paper",
          default_font: (data.defaultFont as "serif" | "song" | "sans") || "serif",
          accent_hex: data.accentHex || "#c08457"
        } as SiteSettingsRecord;
      },
      ["site-settings"],
      { tags: [siteSettingsTag()] }
    )();
  } catch {
    return defaultSettings;
  }
}

export async function listPublishedNovels(): Promise<NovelRecord[]> {
  try {
    return await unstable_cache(
      async () => {
        const data = await prisma.novel.findMany({
          where: { status: "published" },
          orderBy: { sortOrder: 'asc' }
        });

        return data.map(d => ({
          id: d.id,
          title: d.title,
          slug: d.slug,
          summary: d.summary || "",
          cover_url: d.coverUrl,
          backdrop_url: d.backdropUrl,
          sort_order: d.sortOrder,
          status: d.status as PublishState,
          created_at: d.createdAt?.toISOString()
        })) as NovelRecord[];
      },
      ["published-novels"],
      { tags: [siteSettingsTag(), novelListTag()] }
    )();
  } catch {
    return [];
  }
}

export async function listAllNovels(): Promise<NovelRecord[]> {
  try {
    const data = await prisma.novel.findMany({
      orderBy: { sortOrder: 'asc' }
    });

    return data.map(d => ({
          id: d.id,
          title: d.title,
          slug: d.slug,
          summary: d.summary || "",
          cover_url: d.coverUrl,
          backdrop_url: d.backdropUrl,
          sort_order: d.sortOrder,
          status: d.status as PublishState,
          created_at: d.createdAt?.toISOString()
    })) as NovelRecord[];
  } catch {
    return [];
  }
}

export async function getNovelBySlug(
  slug: string,
): Promise<NovelRecord | null> {
  try {
    return await unstable_cache(
      async () => {
        const data = await prisma.novel.findUnique({
          where: { slug }
        });
        if (!data) return null;
        return {
          id: data.id,
          title: data.title,
          slug: data.slug,
          summary: data.summary || "",
          cover_url: data.coverUrl,
          backdrop_url: data.backdropUrl,
          sort_order: data.sortOrder,
          status: data.status as PublishState,
          created_at: data.createdAt?.toISOString()
        } as NovelRecord;
      },
      ["novel-by-slug", slug],
      { tags: [novelCacheTag(slug)] }
    )();
  } catch {
    return null;
  }
}

export async function getNovelById(id: string): Promise<NovelRecord | null> {
  try {
    const data = await prisma.novel.findUnique({ where: { id } });
    if (!data) return null;
    return {
          id: data.id,
          title: data.title,
          slug: data.slug,
          summary: data.summary || "",
          cover_url: data.coverUrl,
          backdrop_url: data.backdropUrl,
          sort_order: data.sortOrder,
          status: data.status as PublishState,
          created_at: data.createdAt?.toISOString()
        } as NovelRecord;
  } catch {
    return null;
  }
}

export async function listChaptersForNovel(novelId: string): Promise<ChapterRecord[]> {
  try {
    return await unstable_cache(
      async () => {
        const data = await prisma.chapter.findMany({
          where: { novelId },
          orderBy: { chapterOrder: 'asc' }
        });
        return data.map((d: any) => ({
          id: d.id,
          title: d.title,
          slug: d.slug,
          novel_id: d.novelId,
          markdown_content: d.markdownContent || "",
          html_cache: d.htmlCache || "",
          word_count: d.wordCount || 0,
          chapter_order: d.chapterOrder,
          status: d.status as PublishState,
          created_at: d.createdAt?.toISOString(),
          updated_at: d.updatedAt?.toISOString()
        })) as ChapterRecord[];
      },
      ["chapters-for-novel", novelId],
      { tags: [siteSettingsTag(), chapterListTag(novelId)] }
    )();
  } catch {
    return [];
  }
}

export async function getChapterBySlug(
  novelId: string,
  chapterSlug: string,
): Promise<ChapterRecord | null> {
  const chapters = await listChaptersForNovel(novelId);
  const chapter = chapters.find((item) => item.slug === chapterSlug) ?? null;
  return chapter;
}

export async function getReaderPreference(userId: string): Promise<ReaderPreferenceRecord | null> {
  try {
    const data = await prisma.readerPreference.findUnique({
      where: { userId }
    });
    if (!data) return null;
    return {
      id: data.id,
      user_id: data.userId,
      font_family: data.fontFamily as "serif" | "song" | "sans",
      font_scale: data.fontScale,
      page_width: data.pageWidth as "narrow" | "standard" | "wide",
      theme: data.theme as "paper" | "night" | "mist",
      background_tone: data.backgroundTone,
    } as ReaderPreferenceRecord;
  } catch {
    return null;
  }
}

export async function saveReaderPreference(
  userId: string,
  input: {
    background_tone?: string | null;
    font_family: ReaderPreferenceRecord["font_family"];
    font_scale: number;
    page_width: ReaderPreferenceRecord["page_width"];
    theme: ReaderPreferenceRecord["theme"];
  },
) {
  const data = await prisma.readerPreference.upsert({
    where: { userId },
    update: {
      fontFamily: input.font_family,
      fontScale: input.font_scale,
      pageWidth: input.page_width,
      theme: input.theme,
      backgroundTone: input.background_tone ?? null,
    },
    create: {
      userId,
      fontFamily: input.font_family,
      fontScale: input.font_scale,
      pageWidth: input.page_width,
      theme: input.theme,
      backgroundTone: input.background_tone ?? null,
    },
  });

  return {
    id: data.id,
    user_id: data.userId,
    font_family: data.fontFamily as ReaderPreferenceRecord["font_family"],
    font_scale: data.fontScale,
    page_width: data.pageWidth as ReaderPreferenceRecord["page_width"],
    theme: data.theme as ReaderPreferenceRecord["theme"],
    background_tone: data.backgroundTone,
  } as ReaderPreferenceRecord;
}

export async function getReadingHistory(userId: string, novelId: string): Promise<ReadingHistoryRecord | null> {
  try {
    const data = await prisma.readingHistory.findFirst({
      where: { userId, novelId }
    });
    if (!data) return null;
    return {
      id: data.id,
      user_id: data.userId,
      novel_id: data.novelId,
      chapter_id: data.chapterId,
      anchor_id: data.anchorId,
      fallback_progress: data.fallbackProgress || 0,
      updated_at: data.updatedAt?.toISOString(),
    } as ReadingHistoryRecord;
  } catch {
    return null;
  }
}

export async function getLatestReadingHistory(userId: string): Promise<LatestReadingRecord | null> {
  try {
    const data = await prisma.readingHistory.findFirst({
      where: {
        userId,
        novel: { status: "published" },
        chapter: { status: "published" },
      },
      orderBy: { updatedAt: "desc" },
      include: {
        novel: true,
        chapter: true,
      },
    });

    if (!data) return null;

    return {
      novel_id: data.novelId,
      novel_title: data.novel.title,
      novel_slug: data.novel.slug,
      chapter_id: data.chapterId,
      chapter_title: data.chapter.title,
      chapter_slug: data.chapter.slug,
      fallback_progress: data.fallbackProgress ?? 0,
      updated_at: data.updatedAt?.toISOString(),
    } as LatestReadingRecord;
  } catch {
    return null;
  }
}

export async function listImportJobs(): Promise<ImportJobRecord[]> {
  try {
    const data = await prisma.importJob.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return data.map((d: any) => ({
      id: d.id,
      file_name: d.fileName,
      source_doc_url: d.sourceDocUrl,
      converted_markdown: d.convertedMarkdown,
      image_manifest: JSON.parse(d.imageManifest || "{}"),
      error_message: d.errorMessage,
      status: d.status as "pending" | "confirmed" | "failed",
      created_at: d.createdAt?.toISOString()
    })) as ImportJobRecord[];
  } catch {
    return [];
  }
}

export async function getImportJobById(id: string): Promise<ImportJobRecord | null> {
  try {
    const data = await prisma.importJob.findUnique({
      where: { id },
    });

    if (!data) return null;

    return {
      id: data.id,
      file_name: data.fileName,
      source_doc_url: data.sourceDocUrl,
      converted_markdown: data.convertedMarkdown,
      image_manifest: JSON.parse(data.imageManifest || "{}"),
      error_message: data.errorMessage,
      status: data.status as "pending" | "confirmed" | "failed",
      created_at: data.createdAt?.toISOString(),
    } as ImportJobRecord;
  } catch {
    return null;
  }
}

export function getCacheTagsForNovel(
  novelId: string,
  slug: string,
  chapterSlugs: string[],
) {
  return [
    novelCacheTag(slug),
    novelListTag(),
    siteSettingsTag(),
    chapterListTag(novelId),
    ...chapterSlugs.map(chapterCacheTag),
  ];
}
