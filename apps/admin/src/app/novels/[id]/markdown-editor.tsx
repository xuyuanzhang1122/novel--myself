"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import TurndownService from "turndown";

import { Button } from "@xu-novel/ui";

import { uploadFileToAdmin } from "../../upload-client";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type MarkdownEditorProps = {
  initialValue: string;
  name: string;
  /** Called when value changes (for controlled use from parent) */
  onChange?: (value: string) => void;
  /** Height class, default "h-[70vh]" */
  heightClass?: string;
};

/* ------------------------------------------------------------------ */
/*  Toolbar helpers                                                    */
/* ------------------------------------------------------------------ */

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
  { label: "分割", icon: "—", title: "分割线", kind: "custom", id: "hr" },
  { label: "链接", icon: "🔗", title: "链接 (Ctrl+K)", kind: "custom", id: "link" },
  { label: "图片", icon: "📷", title: "上传图片", kind: "custom", id: "image" },
];

/* ------------------------------------------------------------------ */
/*  Turndown instance (lazy singleton)                                 */
/* ------------------------------------------------------------------ */

let _turndown: TurndownService | null = null;
function getTurndown() {
  if (!_turndown) {
    _turndown = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      bulletListMarker: "-",
    });
  }
  return _turndown;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function MarkdownEditor({
  initialValue,
  name,
  onChange,
  heightClass = "h-[70vh]",
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Keep parent in sync
  useEffect(() => {
    onChangeRef.current?.(value);
  }, [value]);

  // Sync when initialValue changes from outside (e.g. chapter switching)
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  /* ---- Text manipulation helpers ---- */

  const getTextarea = useCallback(() => textareaRef.current, []);

  const insertAtCursor = useCallback(
    (snippet: string) => {
      setValue((current) => {
        const ta = getTextarea();
        if (!ta) return current + snippet;
        const start = ta.selectionStart ?? current.length;
        const end = ta.selectionEnd ?? current.length;
        const next = current.slice(0, start) + snippet + current.slice(end);
        // Restore cursor after React re-render
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + snippet.length;
          ta.focus();
        });
        return next;
      });
    },
    [getTextarea],
  );

  const wrapSelection = useCallback(
    (before: string, after: string) => {
      const ta = getTextarea();
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const selected = value.slice(start, end) || "文本";
      const replacement = before + selected + after;
      const next = value.slice(0, start) + replacement + value.slice(end);
      setValue(next);
      requestAnimationFrame(() => {
        ta.selectionStart = start + before.length;
        ta.selectionEnd = start + before.length + selected.length;
        ta.focus();
      });
    },
    [value, getTextarea],
  );

  const prefixLines = useCallback(
    (prefix: string) => {
      const ta = getTextarea();
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      // Find line boundaries
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const lineEnd = value.indexOf("\n", end);
      const actualEnd = lineEnd === -1 ? value.length : lineEnd;
      const selectedLines = value.slice(lineStart, actualEnd);

      // Toggle: if all selected lines already have prefix, remove it
      const lines = selectedLines.split("\n");
      const allPrefixed = lines.every((l) => l.startsWith(prefix));
      const newLines = allPrefixed
        ? lines.map((l) => l.slice(prefix.length))
        : lines.map((l) => {
            // Remove existing heading prefixes when adding a new one
            if (prefix.startsWith("#")) {
              return prefix + l.replace(/^#{1,6}\s+/, "");
            }
            return prefix + l;
          });

      const replacement = newLines.join("\n");
      const next = value.slice(0, lineStart) + replacement + value.slice(actualEnd);
      setValue(next);
      requestAnimationFrame(() => {
        ta.selectionStart = lineStart;
        ta.selectionEnd = lineStart + replacement.length;
        ta.focus();
      });
    },
    [value, getTextarea],
  );

  /* ---- Toolbar click handler ---- */

  function handleToolbarAction(action: WrapAction) {
    if (action.kind === "wrap") {
      wrapSelection(action.before, action.after);
    } else if (action.kind === "line-prefix") {
      prefixLines(action.prefix);
    } else if (action.id === "hr") {
      insertAtCursor("\n\n---\n\n");
    } else if (action.id === "link") {
      wrapSelection("[", "](url)");
    } else if (action.id === "image") {
      imageInputRef.current?.click();
    }
  }

  /* ---- Keyboard shortcuts ---- */

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const mod = e.metaKey || e.ctrlKey;
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

    const handler = handlers[e.key.toLowerCase()];
    if (handler) {
      e.preventDefault();
      handler();
    }

    // Tab indent
    if (e.key === "Tab") {
      e.preventDefault();
      insertAtCursor("  ");
    }
  }

  /* ---- Paste handler: convert HTML from Word/rich-text ---- */

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const html = e.clipboardData.getData("text/html");
    if (!html) return; // plain text paste, let browser handle it

    // Check if it looks like rich content (has meaningful HTML tags)
    if (/<(p|h[1-6]|li|table|br|div|span|strong|em|b|i)\b/i.test(html)) {
      e.preventDefault();
      const md = getTurndown().turndown(html);
      insertAtCursor(md);
    }
  }

  /* ---- Image upload ---- */

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

  /* ---- Render ---- */

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-stone-800 bg-stone-950 px-2 py-1.5">
        {TOOLBAR.map((action) => (
          <button
            key={action.label}
            type="button"
            title={action.title}
            onClick={() => handleToolbarAction(action)}
            disabled={action.id === "image" && isUploadingImage}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-stone-400 transition hover:bg-stone-800 hover:text-stone-100 disabled:opacity-40"
          >
            {action.icon}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-stone-800" />
        <span className="text-[11px] text-stone-600">
          {isUploadingImage ? "图片上传中..." : "粘贴 Word 内容可自动转换"}
        </span>
      </div>

      {/* Hidden fields */}
      <input type="hidden" name={name} value={value} />
      <input
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleImageUpload(file);
        }}
        ref={imageInputRef}
        type="file"
      />

      {/* Editor + Preview */}
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="min-w-0">
          <textarea
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            className={`${heightClass} max-h-[80vh] w-full resize-y rounded-[1.75rem] border border-stone-800 bg-stone-950 px-5 py-4 font-mono text-sm leading-7 text-stone-100 outline-none overflow-auto`}
            ref={textareaRef}
            value={value}
          />
          {error ? <p className="mt-2 text-sm text-amber-300">{error}</p> : null}
        </div>
        <div className="min-w-0">
          <div className={`${heightClass} max-h-[80vh] overflow-auto rounded-[1.75rem] border border-stone-800 bg-stone-950`}>
            <div className="prose prose-invert min-h-[320px] max-w-none px-5 py-4 text-sm leading-7 break-words [&_*]:break-words [&_img]:max-w-full [&_img]:rounded-2xl [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
