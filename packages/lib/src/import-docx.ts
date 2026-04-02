import mammoth from "mammoth";
import TurndownService from "turndown";

export async function extractDocx(arrayBuffer: ArrayBuffer) {
  const imageManifest: Record<string, string> = {};
  let imageIndex = 0;

  const result = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      convertImage: mammoth.images.imgElement(async (image) => {
        imageIndex += 1;
        const extension = image.contentType.split("/")[1] ?? "bin";
        const fileName = `image-${imageIndex}.${extension}`;
        const base64 = await image.read("base64");
        const dataUrl = `data:${image.contentType};base64,${base64}`;

        imageManifest[fileName] = dataUrl;

        return {
          src: dataUrl,
          alt: fileName,
        };
      }),
    },
  );
  const html = result.value;
  const messages = result.messages;

  const turndownService = new TurndownService();
  const markdown = turndownService.turndown(html);

  return { markdown, messages, imageManifest };
}

export async function uploadBase64Images(images: Record<string, string>) {
  const entries = Object.entries(images);
  if (entries.length === 0) return {};

  const formData = new FormData();
  entries.forEach(([name, dataUrl]) => {
    const match = dataUrl.match(/^data:([^;,]+);base64,(.+)$/);
    if (!match) {
      throw new Error(`无效的图片数据：${name}`);
    }
    const mimeType = match[1] || "application/octet-stream";
    const buffer = Uint8Array.from(atob(match[2]), (char) => char.charCodeAt(0));
    const file = new File([buffer], name, { type: mimeType });
    formData.append("files", file, name);
  });
  formData.append("folder", "imports");
  formData.append("description", "Uploaded from xu-novel DOCX import");

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error || `Upload failed: ${res.statusText}`);
  }

  const data = (await res.json()) as {
    files?: Array<{ url?: string; originalName?: string }>;
  };

  const uploaded: Record<string, string> = {};
  entries.forEach(([name], index) => {
    const matched = data.files?.find((file) => file.originalName === name) ?? data.files?.[index];
    if (!matched?.url) {
      throw new Error(`上传成功，但缺少图片地址：${name}`);
    }
    uploaded[name] = matched.url;
  });

  return uploaded;
}

export function replaceDataUrlsWithUploads(markdown: string, uploads: Record<string, string>) {
  let nextMarkdown = markdown;
  Object.entries(uploads).forEach(([fileName, url]) => {
    const escapedName = fileName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    nextMarkdown = nextMarkdown.replace(
      new RegExp(`!\\[${escapedName}\\]\\((data:[^)]+)\\)`, "g"),
      `![${fileName}](${url})`,
    );
    nextMarkdown = nextMarkdown.replace(
      new RegExp(`<img\\s+src="data:[^"]*"\\s+alt="${escapedName}"\\s*/?>`, "g"),
      `![${fileName}](${url})`,
    );
    nextMarkdown = nextMarkdown.replace(
      new RegExp(`<img\\s+alt="${escapedName}"\\s+src="data:[^"]*"\\s*/?>`, "g"),
      `![${fileName}](${url})`,
    );
  });
  return nextMarkdown;
}


export type DetectedChapter = {
  title: string;
  content: string;
};

/**
 * Split a full markdown document into chapters.
 * Recognises `# Title` (h1) as book title, and any of:
 *   - `# Chapter`   /  `## Chapter`  headings
 *   - headings containing 第X章 / 第X节 patterns
 * as chapter boundaries.
 *
 * Returns { bookTitle, chapters[] }.
 */
export function splitMarkdownIntoChapters(markdown: string): {
  bookTitle: string;
  chapters: DetectedChapter[];
} {
  const lines = markdown.split("\n");

  // --- detect heading lines & classify ---
  type HeadingInfo = { index: number; level: number; text: string };
  const headings: HeadingInfo[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // ATX headings: # Title
    const atx = line.match(/^(#{1,6})\s+(.+)$/);
    if (atx) {
      headings.push({ index: i, level: atx[1].length, text: atx[2].trim() });
      continue;
    }
    // Setext headings:  Title \n ===== / -----
    if (
      i + 1 < lines.length &&
      lines[i].trim().length > 0 &&
      /^={3,}\s*$/.test(lines[i + 1])
    ) {
      headings.push({ index: i, level: 1, text: lines[i].trim() });
      continue;
    }
    if (
      i + 1 < lines.length &&
      lines[i].trim().length > 0 &&
      /^-{3,}\s*$/.test(lines[i + 1])
    ) {
      headings.push({ index: i, level: 2, text: lines[i].trim() });
    }
  }

  // No headings at all → single chapter with entire content
  if (headings.length === 0) {
    return {
      bookTitle: "",
      chapters: [{ title: "第一章", content: markdown.trim() }],
    };
  }

  // The first h1 is treated as the book title
  let bookTitle = "";
  let chapterHeadings: HeadingInfo[] = [];

  const firstH1 = headings.find((h) => h.level === 1);
  if (firstH1 && firstH1 === headings[0]) {
    bookTitle = firstH1.text;
    chapterHeadings = headings.slice(1);
  } else {
    chapterHeadings = headings;
  }

  // Determine the "chapter level": use the most common heading level among
  // remaining headings, or the smallest level present.
  // Also, headings matching 第X章/第X节 are always treated as chapter splits.
  const chapterPattern = /第[一二三四五六七八九十百千\d]+[章节回卷篇]/;

  if (chapterHeadings.length === 0) {
    // Only a book title, rest is a single chapter
    const contentStart = firstH1
      ? // skip past setext underline if present
        lines[firstH1.index + 1]?.match(/^={3,}\s*$/)
        ? firstH1.index + 2
        : firstH1.index + 1
      : 0;
    const content = lines.slice(contentStart).join("\n").trim();
    return {
      bookTitle,
      chapters: content
        ? [{ title: "第一章", content }]
        : [],
    };
  }

  // Determine the heading level that acts as chapter delimiter.
  // Prefer headings that match the chapter pattern; otherwise use the smallest level.
  const patternMatches = chapterHeadings.filter((h) =>
    chapterPattern.test(h.text),
  );
  const splitLevel =
    patternMatches.length > 0
      ? Math.min(...patternMatches.map((h) => h.level))
      : Math.min(...chapterHeadings.map((h) => h.level));

  const splitHeadings = chapterHeadings.filter((h) => h.level <= splitLevel);

  if (splitHeadings.length === 0) {
    const contentStart = firstH1
      ? lines[firstH1.index + 1]?.match(/^={3,}\s*$/)
        ? firstH1.index + 2
        : firstH1.index + 1
      : 0;
    const content = lines.slice(contentStart).join("\n").trim();
    return {
      bookTitle,
      chapters: content ? [{ title: "第一章", content }] : [],
    };
  }

  // Collect content before first chapter heading (preface / intro)
  const chapters: DetectedChapter[] = [];
  const firstSplitLine = splitHeadings[0].index;
  const contentBeforeStart = bookTitle
    ? (lines[headings[0].index + 1]?.match(/^={3,}\s*$/)
        ? headings[0].index + 2
        : headings[0].index + 1)
    : 0;

  const preface = lines.slice(contentBeforeStart, firstSplitLine).join("\n").trim();
  if (preface) {
    chapters.push({ title: "前言", content: preface });
  }

  // For each split heading, collect content until the next split heading
  for (let i = 0; i < splitHeadings.length; i++) {
    const heading = splitHeadings[i];
    const nextHeading = splitHeadings[i + 1];

    // Skip setext underline line
    let bodyStart = heading.index + 1;
    if (
      bodyStart < lines.length &&
      /^[=-]{3,}\s*$/.test(lines[bodyStart])
    ) {
      bodyStart += 1;
    }

    const bodyEnd = nextHeading ? nextHeading.index : lines.length;
    const content = lines.slice(bodyStart, bodyEnd).join("\n").trim();

    chapters.push({
      title: heading.text,
      content,
    });
  }

  return { bookTitle, chapters };
}

export const parseDocxToMarkdown = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await extractDocx(arrayBuffer);
  return {
    markdown: result.markdown,
    messages: result.messages,
    imageManifest: result.imageManifest,
  };
};

export const uploadImportImages = async (params: { files: Record<string, string> }) => {
  return uploadBase64Images(params.files);
};
