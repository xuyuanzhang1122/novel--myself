"use client";

import { useId, useRef, useState } from "react";

import { Button } from "@xu-novel/ui";

import { uploadFileToAdmin } from "./upload-client";

type ImageUploadFieldProps = {
  folder: string;
  helpText?: string;
  initialValue?: string | null;
  label: string;
  name: string;
  previewClassName?: string;
};

export function ImageUploadField({
  folder,
  helpText,
  initialValue,
  label,
  name,
  previewClassName = "aspect-[16/9]",
}: ImageUploadFieldProps) {
  const inputId = useId();
  const urlInputId = useId();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState(initialValue ?? "");
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isCheckingPreview, setIsCheckingPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(initialValue ?? "");
  const [previewError, setPreviewError] = useState("");
  const [previewMessage, setPreviewMessage] = useState(initialValue ? "已载入当前图片预览。" : "");
  const [previewVersion, setPreviewVersion] = useState(0);

  const previewSrc = previewUrl
    ? `${previewUrl}${previewUrl.includes("?") ? "&" : "?"}v=${previewVersion}`
    : "";

  async function handleFileChange(file: File) {
    setError("");
    setPreviewError("");
    setPreviewMessage("");
    setIsUploading(true);

    try {
      const uploaded = await uploadFileToAdmin({ file, folder });
      setValue(uploaded.url);
      setPreviewUrl(uploaded.thumbUrl || uploaded.url);
      setPreviewVersion(Date.now());
      setPreviewMessage("已上传到对象存储，可直接保存。");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "上传失败");
    } finally {
      setIsUploading(false);
      if (fileRef.current) {
        fileRef.current.value = "";
      }
    }
  }

  function handleDetectPreview() {
    const trimmedValue = value.trim();
    setPreviewError("");
    setPreviewMessage("");

    if (!trimmedValue) {
      setPreviewUrl("");
      return;
    }

    setIsCheckingPreview(true);
    setPreviewUrl(trimmedValue);
    setPreviewVersion(Date.now());
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm text-stone-400" htmlFor={urlInputId}>
          {label}
        </label>
        {value ? (
          <button
            className="text-xs text-stone-500 underline underline-offset-4"
            onClick={() => {
              setValue("");
              setPreviewUrl("");
              setPreviewError("");
              setPreviewMessage("");
            }}
            type="button"
          >
            移除图片
          </button>
        ) : null}
      </div>

      <input name={name} type="hidden" value={value} />

      <div className="rounded-[1.75rem] border border-stone-800 bg-stone-950 p-4">
        <div className="mb-4 flex flex-col gap-3 md:flex-row">
          <input
            className="min-w-0 flex-1 rounded-2xl border border-stone-800 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-stone-600"
            id={urlInputId}
            onChange={(event) => {
              setValue(event.target.value);
              setError("");
            }}
            placeholder="粘贴对象存储 URL 或任意可访问图片地址"
            value={value}
          />
          <Button
            disabled={isCheckingPreview || isUploading}
            onClick={handleDetectPreview}
            type="button"
            variant="secondary"
          >
            {isCheckingPreview ? "检测中..." : "检测图片"}
          </Button>
        </div>

        <div
          className={`relative overflow-hidden rounded-[1.25rem] border border-stone-800 bg-stone-900/70 ${previewClassName}`}
        >
          {previewUrl && !previewError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={label}
              className="h-full w-full object-cover"
              decoding="async"
              loading="lazy"
              onError={() => {
                setIsCheckingPreview(false);
                setPreviewError("图片地址已保存，但当前预览加载失败。可点击“查看原图”确认资源。");
                setPreviewMessage("");
              }}
              onLoad={() => {
                setIsCheckingPreview(false);
                setPreviewError("");
                setPreviewMessage("检测成功，图片可正常加载。");
              }}
              src={previewSrc}
            />
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-center text-sm text-stone-500">
              {previewError || "暂无图片，点击下方按钮上传。"}
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            disabled={isUploading}
            onClick={() => fileRef.current?.click()}
            type="button"
            variant="secondary"
          >
            {isUploading ? "上传中..." : "上传到对象存储"}
          </Button>
          {value ? (
            <a
              className="text-xs text-stone-400 underline underline-offset-4"
              href={value}
              rel="noreferrer"
              target="_blank"
            >
              查看原图
            </a>
          ) : null}
        </div>

        {helpText ? (
          <p className="mt-3 text-xs leading-6 text-stone-500">{helpText}</p>
        ) : null}
        {previewMessage ? <p className="mt-2 text-sm text-emerald-300">{previewMessage}</p> : null}
        {previewError ? <p className="mt-2 text-sm text-amber-300">{previewError}</p> : null}
        {error ? <p className="mt-2 text-sm text-amber-300">{error}</p> : null}
      </div>

      <input
        accept="image/*"
        className="hidden"
        id={inputId}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFileChange(file);
        }}
        ref={fileRef}
        type="file"
      />
    </div>
  );
}
