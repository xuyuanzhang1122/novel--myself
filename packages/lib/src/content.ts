import GithubSlugger from "github-slugger";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";

import type { ChapterRecord } from "./types";

const slugger = new GithubSlugger();

function stableParagraphId(text: string, seen: Map<string, number>) {
  const normalized =
    text.replace(/\s+/g, " ").trim().slice(0, 64) || "paragraph";
  const base = slugger.slug(normalized, false);
  const current = seen.get(base) ?? 0;
  seen.set(base, current + 1);
  return current === 0 ? `para-${base}` : `para-${base}-${current + 1}`;
}

function paragraphAnchors() {
  return (tree: any) => {
    const seen = new Map<string, number>();
    visit(tree, "element", (node: any) => {
      if (node.tagName === "p") {
        const text = collectNodeText(node);
        node.properties = node.properties || {};
        node.properties.id = stableParagraphId(text || "paragraph", seen);
      }
    });
  };
}

function collectNodeText(node: any): string {
  if (!node) return "";
  if (node.type === "text") return node.value ?? "";
  if (!Array.isArray(node.children)) return "";
  return node.children
    .map((child: any) => collectNodeText(child))
    .join(" ")
    .trim();
}

export async function markdownToHtml(markdown: string) {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize)
    .use(paragraphAnchors)
    .use(rehypeStringify)
    .process(markdown);

  return String(result);
}

export function estimateWordCount(markdown: string) {
  // For Chinese manuscripts, counting non-whitespace characters is a practical word-count proxy.
  return markdown.replace(/\s+/g, "").length;
}

export function chapterCacheTag(chapterSlug: string) {
  return `chapter:${chapterSlug}`;
}

export function chapterListTag(novelId: string) {
  return `chapters:${novelId}`;
}

export function novelCacheTag(novelSlug: string) {
  return `novel:${novelSlug}`;
}

export function novelListTag() {
  return "novels:list";
}

export function siteSettingsTag() {
  return "site:settings";
}

export function getProgressFallbackForChapter(
  chapter: ChapterRecord,
  anchorId?: string | null,
) {
  if (!anchorId || !chapter.html_cache) return 0;
  const index = chapter.html_cache.indexOf(`id="${anchorId}"`);
  if (index <= 0) return 0;
  return Number((index / chapter.html_cache.length).toFixed(4));
}
