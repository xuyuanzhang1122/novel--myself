"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import TurndownService from "turndown";

import { Button, cn } from "@xu-novel/ui";

import { uploadFileToAdmin } from "../../upload-client";

type MarkdownEditorProps = {
  initialValue: string;
  name: string;
  onChange?: (value: string) => void;
  heightClass?: string;
};

type EditorViewMode = "write" | "split" | "preview";

type WrapAction = {
  label: string;
  icon: string;
  title: string;
} & (
  | { kind: "wrap"; before: string; after: string }
  | { kind: "line-prefix"; prefix: string }
  | { kind: "custom"; id: string }
);

const TOOLBAR: WrapAction[] = [
  { label: "H1", icon: "H1", title: "标题一 (Ctrl+1)", kind: "line-prefix", prefix: "# " },
  { label: "H2", icon: "H2", title: "标题二 (Ctrl+2)", kind: "line-prefix", prefix: "## " },
  { label: "H3", icon: "H3", title: "标题三 (Ctrl+3)", kind: "line-prefix", prefix: "### " },
  { label: "B", icon: "B", title: "加粗 (Ctrl+B)", kind: "wrap", before: "**", after: "**" },
  { label: "I", icon: "I", title: "斜体 (Ctrl+I)", kind: "wrap", before: "*", after: "*" },
  { label: "S", icon: "S", title: "删除线 (Ctrl+D)", kind: "wrap", before: "~~", after: "~~" },
  { label: "引用", icon: ">", title: "引用 (Ctrl+Q)", kind: "line-prefix", prefix: "> " },
  { label: "代码", icon: "`", title: "行内代码 (Ctrl+E)", kind: "wrap", before: "`", after: "`" },
  { label: "无序", icon: "•", title: "无序列表 (Ctrl+U)", kind: "line-prefix", prefix: "- " },
  { label: "有序", icon: "1.", title: "有序列表 (Ctrl+O)", kind: "line-prefix", prefix: "1. " },
  { label: "分割", icon: "---", title: "分割线", kind: "custom", id: "hr" },
  { label: "链接", icon: "链", title: "链接 (Ctrl+K)", kind: "custom", id: "link" },
  { label: "图片", icon: "图", title: "上传图片", kind: "custom", id: "image" },
];

let turndownSingleton: TurndownService | null = null;

function getTurndown() {
  if (!turndownSingleton) {
    turndownSingleton = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      bulletListMarker: "-",
    });
  }

  return turndownSingleton;
}

export function MarkdownEditor({
  initialValue,
  name,
  onChange,
  heightClass = "h-[76vh]",
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [viewMode, setViewMode] = useState<EditorViewMode>("write");
  const [isToolbarOpen, setIsToolbarOpen] = useState(true);
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  useEffect(() => {
    onChangeRef.current?.(value);
  }, [value]);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const getTextarea = useCallback(() => textareaRef.current, []);

  const insertAtCursor = useCallback(
    (snippet: string) => {
      setValue((current) => {
        const textarea = getTextarea();
        if (!textarea) return current + snippet;

        const start = textarea.selectionStart ?? current.length;
        const end = textarea.selectionEnd ?? current.length;
        const next = current.slice(0, start) + snippet + current.slice(end);

        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = start + snippet.length;
          textarea.focus();
        });

        return next;
      });
    },
    [getTextarea],
  );

  const wrapSelection = useCallback(
    (before: string, after: string) => {
      const textarea = getTextarea();
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = value.slice(start, end) || "文本";
      const replacement = before + selected + after;
      const next = value.slice(0, start) + replacement + value.slice(end);

      setValue(next);
      requestAnimationFrame(() => {
        textarea.selectionStart = start + before.length;
        textarea.selectionEnd = start + before.length + selected.length;
        textarea.focus();
      });
    },
    [value, getTextarea],
  );

  const prefixLines = useCallback(
    (prefix: string) => {
      const textarea = getTextarea();
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const lineEnd = value.indexOf("\n", end);
      const actualEnd = lineEnd === -1 ? value.length : lineEnd;
      const selectedLines = value.slice(lineStart, actualEnd);
      const lines = selectedLines.split("\n");
      const allPrefixed = lines.every((line) => line.startsWith(prefix));
      const nextLines = allPrefixed
        ? lines.map((line) => line.slice(prefix.length))
        : lines.map((line) => {
            if (prefix.startsWith("#")) {
              return prefix + line.replace(/^#{1,6}\s+/, "");
            }

            return prefix + line;
          });

      const replacement = nextLines.join("\n");
      const next = value.slice(0, lineStart) + replacement + value.slice(actualEnd);

      setValue(next);
      requestAnimationFrame(() => {
        textarea.selectionStart = lineStart;
        textarea.selectionEnd = lineStart + replacement.length;
        textarea.focus();
      });
    },
    [value, getTextarea],
  );

  function handleToolbarAction(action: WrapAction) {
    if (action.kind === "wrap") {
      wrapSelection(action.before, action.after);
      return;
    }

    if (action.kind === "line-prefix") {
      prefixLines(action.prefix);
      return;
    }

    if (action.id === "hr") {
      insertAtCursor("\n\n---\n\n");
      return;
    }

    if (action.id === "link") {
      wrapSelection("[", "](url)");
      return;
    }

    if (action.id === "image") {
      imageInputRef.current?.click();
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    const mod = event.metaKey || event.ctrlKey;
    if (!mod) return;

    const handlers: Record<string, () => void> = {
      b: () => wrapSelection("**", "**"),
      i: () => wrapSelection("*", "*"),
      d: () => wrapSelection("~~", "~~"),
      e: () => wrapSelection("`", "`"),
      q: () => prefixLines("> "),
      k: () => wrapSelection("[", "](url)"),
      u: () => prefixLines("- "),
      o: () => prefixLines("1. "),
      "1": () => prefixLines("# "),
      "2": () => prefixLines("## "),
      "3": () => prefixLines("### "),
    };

    const handler = handlers[event.key.toLowerCase()];
    if (handler) {
      event.preventDefault();
      handler();
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      insertAtCursor("  ");
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
    const html = event.clipboardData.getData("text/html");
    if (!html) return;

    if (/<(p|h[1-6]|li|table|br|div|span|strong|em|b|i)\b/i.test(html)) {
      event.preventDefault();
      const markdown = getTurndown().turndown(html);
      insertAtCursor(markdown);
    }
  }

  async function handleImageUpload(file: File) {
    setError("");
    setIsUploadingImage(true);

    try {
      const uploaded = await uploadFileToAdmin({ file, folder: "chapters" });
      insertAtCursor(`\n\n![${uploaded.fileName}](${uploaded.url})\n\n`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "图片上传失败");
    } finally {
      setIsUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  }

  const metrics = getEditorMetrics(value);
  const showEditor = viewMode !== "preview";
  const showPreview = viewMode !== "write";

  return (
    <div className="space-y-4">
      <div className="rounded-[1.75rem] border border-stone-800 bg-stone-950/80 px-3 py-3">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => setIsToolbarOpen((current) => !current)}
                type="button"
                variant="ghost"
              >
                {isToolbarOpen ? "收起格式工具" : "展开格式工具"}
              </Button>
              <Button
                onClick={() => setIsStatsOpen((current) => !current)}
                type="button"
                variant="ghost"
              >
                {isStatsOpen ? "收起数据面板" : "展开数据面板"}
              </Button>
              <span className="text-[11px] text-stone-600">
                {isUploadingImage ? "图片上传中..." : "粘贴 Word 内容会自动转成 Markdown"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {[
                { id: "write", label: "写作" },
                { id: "split", label: "分栏" },
                { id: "preview", label: "预览" },
              ].map((mode) => (
                <button
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs tracking-[0.18em] transition",
                    viewMode === mode.id
                      ? "bg-amber-200/16 text-amber-50"
                      : "text-stone-400 hover:bg-stone-800 hover:text-stone-100",
                  )}
                  key={mode.id}
                  onClick={() => setViewMode(mode.id as EditorViewMode)}
                  type="button"
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {isToolbarOpen ? (
            <div className="flex flex-wrap items-center gap-1.5 border-t border-stone-800 pt-3">
              {TOOLBAR.map((action) => (
                <button
                  className="rounded-xl px-2.5 py-1.5 text-xs font-medium text-stone-400 transition hover:bg-stone-800 hover:text-stone-100 disabled:opacity-40"
                  disabled={action.kind === "custom" && action.id === "image" && isUploadingImage}
                  key={action.label}
                  onClick={() => handleToolbarAction(action)}
                  title={action.title}
                  type="button"
                >
                  {action.icon}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {isStatsOpen ? (
        <div className="grid gap-3 md:grid-cols-4">
          <MetricCard label="正文字符" value={String(metrics.wordCount)} />
          <MetricCard label="标题数量" value={String(metrics.headingCount)} />
          <MetricCard label="段落块" value={String(metrics.paragraphCount)} />
          <MetricCard label="预计阅读" value={`${metrics.readingMinutes} 分钟`} />
        </div>
      ) : (
        <div className="rounded-[1.5rem] border border-stone-800/80 bg-stone-950/60 px-4 py-3 text-sm text-stone-400">
          当前正文 {metrics.wordCount} 字，约 {metrics.readingMinutes} 分钟阅读。
        </div>
      )}

      <input name={name} type="hidden" value={value} />
      <input
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleImageUpload(file);
        }}
        ref={imageInputRef}
        type="file"
      />

      <div className={cn("grid gap-4", viewMode === "split" && "xl:grid-cols-2")}>
        {showEditor ? (
          <div className="min-w-0 overflow-hidden rounded-[1.75rem] border border-stone-800 bg-stone-950">
            <div className="flex items-center justify-between border-b border-stone-800 px-5 py-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">写作区</p>
                <p className="mt-1 text-sm text-stone-400">默认进入写作态，分栏和预览按需要再打开。</p>
              </div>
              <Button onClick={() => setViewMode("preview")} type="button" variant="ghost">
                仅看预览
              </Button>
            </div>
            <textarea
              className={`${heightClass} max-h-[82vh] w-full resize-y overflow-auto bg-transparent px-5 py-4 font-mono text-sm leading-7 text-stone-100 outline-none`}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              ref={textareaRef}
              value={value}
            />
          </div>
        ) : null}

        {showPreview ? (
          <div className="min-w-0 overflow-hidden rounded-[1.75rem] border border-stone-800 bg-stone-950">
            <div className="flex items-center justify-between border-b border-stone-800 px-5 py-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">阅读预览</p>
                <p className="mt-1 text-sm text-stone-400">这里尽量接近前台阅读观感，不再只是黑底代码块。</p>
              </div>
              <Button onClick={() => setViewMode("write")} type="button" variant="ghost">
                仅看正文
              </Button>
            </div>
            <div className={`${heightClass} max-h-[82vh] overflow-auto bg-stone-900 px-4 py-4`}>
              <div className="paper-noise min-h-full rounded-[1.5rem] border border-amber-200/60 px-6 py-6 text-stone-900 shadow-[0_30px_70px_-50px_rgba(0,0,0,0.35)]">
                <div className="prose prose-stone max-w-none break-words font-serif text-[15px] leading-8 [&_*]:break-words [&_img]:max-w-full [&_img]:rounded-2xl [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {error ? <p className="rounded-xl bg-amber-950/30 px-4 py-3 text-sm text-amber-300">{error}</p> : null}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.4rem] border border-stone-800 bg-stone-900/70 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.24em] text-stone-500">{label}</p>
      <p className="mt-3 font-serif text-3xl tracking-tight text-stone-100">{value}</p>
    </div>
  );
}

function getEditorMetrics(value: string) {
  const plainText = value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/[>#*_`~-]/g, " ")
    .replace(/\s+/g, "");

  const wordCount = plainText.length;
  const headingCount = (value.match(/^#{1,6}\s+/gm) ?? []).length;
  const paragraphCount = value
    .split(/\n{2,}/)
    .map((section) => section.trim())
    .filter(Boolean).length;

  return {
    wordCount,
    headingCount,
    paragraphCount,
    readingMinutes: Math.max(1, Math.ceil(wordCount / 700)),
  };
}
