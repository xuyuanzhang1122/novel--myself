"use client";

import Image from "next/image";
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
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState(initialValue ?? "");
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [previewVersion, setPreviewVersion] = useState(0);

  const previewSrc = value
    ? `${value}${value.includes("?") ? "&" : "?"}v=${previewVersion}`
    : "";

  async function handleFileChange(file: File) {
    setError("");
    setPreviewError("");
    setIsUploading(true);

    try {
      const uploaded = await uploadFileToAdmin({ file, folder });
      setValue(uploaded.url);
      setPreviewVersion(Date.now());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "上传失败");
    } finally {
      setIsUploading(false);
      if (fileRef.current) {
        fileRef.current.value = "";
      }
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm text-stone-400" htmlFor={inputId}>
          {label}
        </label>
        {value ? (
          <button
            className="text-xs text-stone-500 underline underline-offset-4"
            onClick={() => {
              setValue("");
              setPreviewError("");
            }}
            type="button"
          >
            移除图片
          </button>
        ) : null}
      </div>

      <input name={name} type="hidden" value={value} />

      <div className="rounded-[1.75rem] border border-stone-800 bg-stone-950 p-4">
        <div
          className={`relative overflow-hidden rounded-[1.25rem] border border-stone-800 bg-stone-900/70 ${previewClassName}`}
        >
          {value && !previewError ? (
            <Image
              alt={label}
              className="object-cover"
              fill
              onError={() => {
                setPreviewError("图片地址已保存，但当前预览加载失败。可点击“查看原图”确认资源。");
              }}
              onLoad={() => {
                setPreviewError("");
              }}
              sizes="(min-width: 1280px) 28rem, 100vw"
              src={previewSrc}
              unoptimized
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
            {isUploading ? "上传中..." : "上传图片"}
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
