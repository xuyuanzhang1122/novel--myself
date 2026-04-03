"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  parseDocxToMarkdown,
  replaceDataUrlsWithUploads,
  uploadImportImages,
} from "@xu-novel/lib/client";
import { Button, Panel } from "@xu-novel/ui";

import { saveImportJobAction } from "./actions";

export function ImportDocxForm() {
  const router = useRouter();
  const [preview, setPreview] = useState<string>("");
  const [messages, setMessages] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isPending, setIsPending] = useState(false);
  const [stage, setStage] = useState<"idle" | "parsing" | "uploading" | "saving">("idle");

  async function handleChange(file: File) {
    try {
      setError("");
      setFileName(file.name);
      setStage("parsing");

      const result = await parseDocxToMarkdown(file);
      const rawMessages = result.messages.map((message) => message.message);

      setStage("uploading");
      const uploads =
        Object.keys(result.imageManifest).length > 0
          ? await uploadImportImages({
              files: result.imageManifest,
            })
          : {};

      const convertedMarkdown = replaceDataUrlsWithUploads(result.markdown, uploads);
      setPreview(convertedMarkdown);
      setMessages(rawMessages);

      setStage("saving");
      setIsPending(true);
      try {
        await saveImportJobAction({
          fileName: file.name,
          convertedMarkdown,
          imageManifest: uploads,
        });
        router.refresh();
      } finally {
        setIsPending(false);
        setStage("idle");
      }
    } catch (cause: any) {
      setError(cause instanceof Error ? cause.message : "导入失败");
      setStage("idle");
      setIsPending(false);
    }
  }

  const metrics = useMemo(() => {
    const plainText = preview.replace(/\s+/g, "");
    return {
      wordCount: plainText.length,
      headingCount: (preview.match(/^#{1,6}\s+/gm) ?? []).length,
      readingMinutes: Math.max(1, Math.ceil(plainText.length / 700)),
    };
  }, [preview]);

  return (
    <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
      <Panel className="min-w-0 space-y-5 border-stone-800 bg-stone-900/70">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.28em] text-stone-500">导入入口</p>
          <h3 className="font-serif text-3xl tracking-tight">上传 .docx</h3>
          <p className="text-sm leading-7 text-stone-400">
            浏览器端会先解析 Word，再上传图片，最后把整理后的 Markdown 存成待处理任务。
          </p>
        </div>

        <label className="block">
          <input
            accept=".docx"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleChange(file);
            }}
            type="file"
          />
          <span className="inline-flex cursor-pointer items-center rounded-full bg-stone-100 px-5 py-3 text-sm font-medium text-stone-950">
            选择文档
          </span>
        </label>

        <div className="grid gap-3">
          {[
            ["1", "解析文档", stage === "parsing"],
            ["2", "上传图片", stage === "uploading"],
            ["3", "保存任务", stage === "saving"],
          ].map(([index, label, active]) => (
            <div
              className="flex items-center gap-3 rounded-[1.3rem] border border-stone-800 bg-stone-950/70 px-4 py-3"
              key={String(index)}
            >
              <span
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs ${
                  active ? "bg-amber-300/20 text-amber-200" : "bg-stone-800 text-stone-400"
                }`}
              >
                {index}
              </span>
              <span className="text-sm text-stone-300">{label}</span>
            </div>
          ))}
        </div>

        <div className="space-y-3 rounded-[1.5rem] border border-stone-800 bg-stone-950/70 px-4 py-4 text-sm leading-7 text-stone-300">
          <p className="text-xs uppercase tracking-[0.24em] text-stone-500">当前文件</p>
          <p>{fileName || "还没有选择文档"}</p>
          {isPending ? <p className="text-amber-300">正在保存导入任务...</p> : null}
          {error ? <p className="text-amber-300">{error}</p> : null}
        </div>

        {messages.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.24em] text-stone-500">解析提示</p>
            <ul className="space-y-2 text-sm text-stone-400">
              {messages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </Panel>

      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["正文字符", String(metrics.wordCount)],
            ["检测标题", String(metrics.headingCount)],
            ["预计阅读", `${metrics.readingMinutes} 分钟`],
          ].map(([label, value]) => (
            <Panel className="space-y-3 border-stone-800 bg-stone-900/70" key={label}>
              <p className="text-xs uppercase tracking-[0.22em] text-stone-500">{label}</p>
              <p className="font-serif text-3xl tracking-tight">{value}</p>
            </Panel>
          ))}
        </div>

        <Panel className="min-w-0 space-y-4 border-stone-800 bg-stone-900/70">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">预览</p>
            <p className="text-sm leading-7 text-stone-400">
              这里先看 Markdown 是否干净，再决定要不要进入导入详情页拆章。
            </p>
          </div>
          <div className="max-h-[40rem] overflow-auto rounded-[1.5rem] bg-stone-950 px-4 py-4">
            {preview ? (
              <div className="paper-noise rounded-[1.4rem] border border-amber-200/50 px-5 py-5">
                <div className="prose max-w-none break-words text-sm leading-7 [&_*]:break-words [&_img]:max-w-full [&_img]:rounded-2xl [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{preview}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <p className="text-sm text-stone-400">选择文档后，整理后的 Markdown 会显示在这里。</p>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
