export type PublishState = "draft" | "published" | "archived";

export type NovelRecord = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  cover_url: string | null;
  backdrop_url: string | null;
  status: PublishState;
  sort_order: number;
  created_at?: string;
};

export type ChapterRecord = {
  id: string;
  novel_id: string;
  title: string;
  slug: string;
  markdown_content: string;
  html_cache: string | null;
  word_count: number;
  chapter_order: number;
  status: PublishState;
  created_at?: string;
  updated_at?: string;
};

export type SiteSettingsRecord = {
  id: string;
  homepage_background_url: string | null;
  brand_line: string | null;
  hero_eyebrow: string | null;
  hero_title: string | null;
  hero_primary_action: string | null;
  hero_secondary_action: string | null;
  default_theme: "paper" | "night" | "mist";
  default_font: "serif" | "song" | "sans";
  accent_hex: string | null;
};

export type ReaderPreferenceRecord = {
  id: string;
  user_id: string;
  font_family: "serif" | "song" | "sans";
  font_scale: number;
  page_width: "narrow" | "standard" | "wide";
  theme: "paper" | "night" | "mist";
  background_tone: string | null;
};

export type ReadingHistoryRecord = {
  id: string;
  user_id: string;
  novel_id: string;
  chapter_id: string;
  anchor_id: string | null;
  fallback_progress: number | null;
  updated_at?: string;
};

export type ImportJobRecord = {
  id: string;
  file_name: string;
  source_doc_url: string | null;
  converted_markdown: string;
  image_manifest: Record<string, string>;
  status: "pending" | "confirmed" | "failed";
  error_message: string | null;
  created_at?: string;
};

export type ReaderTheme = {
  key: ReaderPreferenceRecord["theme"];
  label: string;
  panelClassName: string;
};

export type RevalidatePayload = {
  tags: string[];
  secret: string;
};
