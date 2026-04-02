"use client";

type UploadedAdminFile = {
  id?: string;
  url: string;
  thumbUrl?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  category?: string;
};

export async function uploadFilesToAdmin(params: {
  files: File[];
  folder: string;
  description?: string;
}) {
  const formData = new FormData();
  params.files.forEach((file) => {
    formData.append("files", file, file.name);
  });
  formData.append("folder", params.folder);
  if (params.description) {
    formData.append("description", params.description);
  }

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "上传失败，请重试。");
  }

  const data = (await response.json()) as { files?: UploadedAdminFile[] };
  if (!data.files || data.files.length === 0) {
    throw new Error("上传成功，但没有返回文件地址。");
  }

  return data.files;
}

export async function uploadFileToAdmin(params: {
  file: File;
  folder: string;
  description?: string;
}) {
  const files = await uploadFilesToAdmin({
    files: [params.file],
    folder: params.folder,
    description: params.description,
  });
  const data = files[0];
  if (!data.url) {
    throw new Error("上传成功，但没有返回可用地址。");
  }

  return {
    fileName: data.originalName || params.file.name,
    url: data.url,
    thumbUrl: data.thumbUrl,
  };
}
