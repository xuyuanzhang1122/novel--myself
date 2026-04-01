"use client";

function sanitizeFileName(name: string) {
  const sanitized = name
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return sanitized || "file";
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("文件读取失败。"));
    };

    reader.onerror = () => reject(new Error("文件读取失败。"));
    reader.readAsDataURL(file);
  });
}

export async function uploadFileToAdmin(params: {
  file: File;
  folder: string;
}) {
  const dataUrl = await readFileAsDataUrl(params.file);
  const path = `media/${params.folder}/${Date.now()}-${sanitizeFileName(params.file.name)}`;

  const response = await fetch("/api/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path,
      dataUrl,
    }),
  });

  if (!response.ok) {
    throw new Error("上传失败，请重试。");
  }

  const data = (await response.json()) as { url?: string };

  if (!data.url) {
    throw new Error("上传成功，但没有返回可用地址。");
  }

  return {
    fileName: params.file.name,
    url: data.url,
  };
}
