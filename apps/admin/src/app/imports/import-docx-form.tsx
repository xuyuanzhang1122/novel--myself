"use client";

import { useState } from "react";
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
  const [error, setError] = useState<string>("");
  const [isPending, setIsPending] = useState(false);

  async function handleChange(file: File) {
    try {
      setError("");
      const result = await parseDocxToMarkdown(file);
      
      const uploads =
        Object.keys(result.imageManifest).length > 0
          ? await uploadImportImages({
              files: result.imageManifest,
            })
          : {};
      const convertedMarkdown = replaceDataUrlsWithUploads(result.markdown, uploads);

      setPreview(convertedMarkdown);
      setMessages(result.messages.map(m => m.message));

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
      }
    } catch (cause: any) {
      setError(cause instanceof Error ? cause.message : "导入失败");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.4fr_0.6fr]">
      <Panel className="min-w-0 space-y-5 border-stone-800 bg-stone-900/70">
        <h3 className="font-serif text-3xl">导入 .docx</h3>
        <label className="block">
          <input
            className="hidden"
            type="file"
            accept=".docx"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleChange(file);
            }}
          />
          <span className="inline-flex cursor-pointer items-center rounded-full bg-stone-100 px-5 py-3 text-sm font-medium text-stone-950">
            选择文档
          </span>
        </label>
        <p className="text-sm leading-7 text-stone-400">
          浏览器端完成 `.docx` 解析，并把图片上传到对象存储。
        </p>
        {error ? <p className="text-sm text-amber-300">{error}</p> : null}
        {messages.length > 0 ? (
          <ul className="space-y-2 text-sm text-stone-400">
            {messages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        ) : null}
        {isPending ? <p className="text-sm text-amber-300">正在保存导入任务...</p> : null}
      </Panel>
      <Panel className="min-w-0 space-y-4 border-stone-800 bg-stone-900/70">
        <p className="text-xs uppercase tracking-[0.22em] text-stone-500">预览</p>
        <div className="max-h-[32rem] overflow-hidden rounded-[1.5rem] bg-stone-950">
          <div className="prose prose-invert max-w-none overflow-auto px-5 py-4 text-sm leading-7 break-words [&_*]:break-words [&_img]:max-w-full [&_img]:rounded-2xl [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap">
            {preview ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{preview}</ReactMarkdown>
            ) : (
              <p className="text-stone-400">Markdown 预览会显示在这里。</p>
            )}
          </div>
        </div>
      </Panel>
    </div>
  );
}
