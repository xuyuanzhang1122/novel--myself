import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const hexPattern = /^#[0-9a-fA-F]{6}$/;

function readField(formData: FormData, name: string) {
  return formData.get(name)?.toString().trim() ?? "";
}

function emptyToNull(value: string) {
  return value === "" ? null : value;
}

const optionalUrl = z
  .string()
  .max(2048, "URL 不能超过 2048 个字符。")
  .refine(
    (value) => value === "" || value.startsWith("/") || URL.canParse(value),
    "请输入有效的 URL。",
  );

function parseWithSchema<T>(schema: z.ZodType<T>, values: unknown) {
  const result = schema.safeParse(values);
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "输入校验失败。");
  }
  return result.data;
}

const appearanceSchema = z.object({
  brand_line: z.string().max(240, "品牌文案不能超过 240 个字符。"),
  hero_eyebrow: z.string().max(32, "Hero 小标题不能超过 32 个字符。"),
  hero_title: z.string().max(120, "Hero 主标题不能超过 120 个字符。"),
  hero_primary_action: z.string().max(24, "主按钮文案不能超过 24 个字符。"),
  hero_secondary_action: z.string().max(24, "次按钮文案不能超过 24 个字符。"),
  homepage_background_url: optionalUrl,
  default_theme: z.enum(["paper", "night", "mist"]),
  default_font: z.enum(["serif", "song", "sans"]),
  accent_hex: z
    .string()
    .refine(
      (value) => value === "" || hexPattern.test(value),
      "强调色必须是 #RRGGBB 格式。",
    ),
});

const novelSchema = z.object({
  id: z.string().uuid("作品 ID 非法。").or(z.literal("")),
  title: z
    .string()
    .min(1, "作品标题不能为空。")
    .max(120, "作品标题不能超过 120 个字符。"),
  slug: z
    .string()
    .min(1, "作品 slug 不能为空。")
    .max(80, "作品 slug 不能超过 80 个字符。")
    .regex(slugPattern, "作品 slug 只能包含小写字母、数字和连字符。"),
  summary: z.string().max(4000, "作品简介不能超过 4000 个字符。"),
  cover_url: optionalUrl,
  backdrop_url: optionalUrl,
  status: z.enum(["draft", "published", "archived"]),
  sort_order: z.coerce
    .number()
    .int("排序值必须是整数。")
    .min(0, "排序值不能小于 0。")
    .max(999999),
});

const chapterSchema = z.object({
  id: z.string().uuid("章节 ID 非法。").or(z.literal("")),
  novel_id: z.string().uuid("作品 ID 非法。"),
  title: z
    .string()
    .min(1, "章节标题不能为空。")
    .max(160, "章节标题不能超过 160 个字符。"),
  slug: z
    .string()
    .min(1, "章节 slug 不能为空。")
    .max(80, "章节 slug 不能超过 80 个字符。")
    .regex(slugPattern, "章节 slug 只能包含小写字母、数字和连字符。"),
  markdown_content: z
    .string()
    .min(1, "章节内容不能为空。")
    .max(2_000_000, "章节内容过长。"),
  chapter_order: z.coerce
    .number()
    .int("章节序号必须是整数。")
    .min(1, "章节序号必须从 1 开始。")
    .max(999999),
  status: z.enum(["draft", "published", "archived"]),
});

export function parseAppearanceInput(formData: FormData) {
  const parsed = parseWithSchema(appearanceSchema, {
    brand_line: readField(formData, "brand_line"),
    hero_eyebrow: readField(formData, "hero_eyebrow"),
    hero_title: readField(formData, "hero_title"),
    hero_primary_action: readField(formData, "hero_primary_action"),
    hero_secondary_action: readField(formData, "hero_secondary_action"),
    homepage_background_url: readField(formData, "homepage_background_url"),
    default_theme: readField(formData, "default_theme") || "paper",
    default_font: readField(formData, "default_font") || "serif",
    accent_hex: readField(formData, "accent_hex") || "#c08457",
  });

  return {
    brand_line: emptyToNull(parsed.brand_line),
    hero_eyebrow: emptyToNull(parsed.hero_eyebrow),
    hero_title: emptyToNull(parsed.hero_title),
    hero_primary_action: emptyToNull(parsed.hero_primary_action),
    hero_secondary_action: emptyToNull(parsed.hero_secondary_action),
    homepage_background_url: emptyToNull(parsed.homepage_background_url),
    default_theme: parsed.default_theme,
    default_font: parsed.default_font,
    accent_hex: parsed.accent_hex || "#c08457",
  };
}

export function parseNovelInput(formData: FormData) {
  const parsed = parseWithSchema(novelSchema, {
    id: readField(formData, "id"),
    title: readField(formData, "title"),
    slug: readField(formData, "slug"),
    summary: readField(formData, "summary"),
    cover_url: readField(formData, "cover_url"),
    backdrop_url: readField(formData, "backdrop_url"),
    status: readField(formData, "status") || "draft",
    sort_order: readField(formData, "sort_order") || "0",
  });

  return {
    id: parsed.id || undefined,
    title: parsed.title,
    slug: parsed.slug,
    summary: emptyToNull(parsed.summary),
    cover_url: emptyToNull(parsed.cover_url),
    backdrop_url: emptyToNull(parsed.backdrop_url),
    status: parsed.status,
    sort_order: parsed.sort_order,
  };
}

export function parseChapterInput(formData: FormData) {
  const parsed = parseWithSchema(chapterSchema, {
    id: readField(formData, "id"),
    novel_id: readField(formData, "novel_id"),
    title: readField(formData, "title"),
    slug: readField(formData, "slug"),
    markdown_content: formData.get("markdown_content")?.toString() ?? "",
    chapter_order: readField(formData, "chapter_order") || "1",
    status: readField(formData, "status") || "draft",
  });

  return {
    id: parsed.id || undefined,
    novel_id: parsed.novel_id,
    title: parsed.title,
    slug: parsed.slug,
    markdown_content: parsed.markdown_content,
    chapter_order: parsed.chapter_order,
    status: parsed.status,
  };
}
