import { NextResponse } from "next/server";

type UploadedFileResponse = {
  id?: string;
  url: string;
  thumbUrl?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  category?: string;
};

const DEFAULT_IMAGE_API_BASE_URL = "https://image.xumy.art";

function getImageApiBaseUrl() {
  return (process.env.IMAGE_API_BASE_URL || DEFAULT_IMAGE_API_BASE_URL).replace(/\/+$/, "");
}

function getImageApiAuthHeaders() {
  const headers = new Headers();
  const apiKey = process.env.IMAGE_API_KEY?.trim();
  if (apiKey) {
    headers.set("X-Api-Key", apiKey);
    return headers;
  }

  const bearerToken = process.env.IMAGE_API_BEARER_TOKEN?.trim();
  if (bearerToken) {
    headers.set("Authorization", `Bearer ${bearerToken}`);
    return headers;
  }

  throw new Error("未配置对象存储认证。请设置 IMAGE_API_KEY 或 IMAGE_API_BEARER_TOKEN。");
}

function normalizeTags(parts: Array<string | null | undefined>) {
  const tags = parts
    .flatMap((part) => (part || "").split(","))
    .map((tag) => tag.trim())
    .filter(Boolean);

  return Array.from(new Set(tags));
}

function fileNameFromPath(path: string) {
  const segments = path.split("/").filter(Boolean);
  return segments.at(-1) || `upload-${Date.now()}`;
}

async function createProxyFormData(req: Request) {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await req.json();
    const dataUrl = typeof body?.dataUrl === "string" ? body.dataUrl : "";
    const path = typeof body?.path === "string" ? body.path : "";
    const folder = typeof body?.folder === "string" ? body.folder : "";

    const match = dataUrl.match(/^data:([^;,]+);base64,(.+)$/);
    if (!match) {
      throw new Error("无效的 dataUrl。");
    }

    const mimeType = match[1] || "application/octet-stream";
    const buffer = Buffer.from(match[2], "base64");
    const file = new File([buffer], fileNameFromPath(path), { type: mimeType });

    const formData = new FormData();
    formData.append("files", file, file.name);

    const tags = normalizeTags(["xu-novel", folder && folder.replaceAll("/", "-")]);
    if (tags.length > 0) {
      formData.append("tags", tags.join(","));
    }
    formData.append("description", "Uploaded via xu-novel admin");

    return formData;
  }

  const incoming = await req.formData();
  const files = incoming.getAll("files").filter((value): value is File => value instanceof File);
  if (files.length === 0) {
    throw new Error("未收到要上传的文件。");
  }

  const folder = incoming.get("folder")?.toString() ?? "";
  const tags = normalizeTags([
    "xu-novel",
    folder && folder.replaceAll("/", "-"),
    incoming.get("tags")?.toString(),
  ]);
  const description = incoming.get("description")?.toString();

  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file, file.name);
  });
  if (tags.length > 0) {
    formData.append("tags", tags.join(","));
  }
  if (description) {
    formData.append("description", description);
  }

  return formData;
}

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const upstreamFormData = await createProxyFormData(req);
    const response = await fetch(`${getImageApiBaseUrl()}/api/upload`, {
      method: "POST",
      headers: getImageApiAuthHeaders(),
      body: upstreamFormData,
    });

    const data = (await response.json().catch(() => null)) as
      | { ok?: boolean; files?: UploadedFileResponse[]; error?: string; message?: string }
      | null;

    if (!response.ok || !data?.ok) {
      return NextResponse.json(
        {
          error: data?.error || data?.message || "对象存储上传失败。",
        },
        { status: response.status || 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      files: data.files ?? [],
      url: data.files?.[0]?.url,
      thumbUrl: data.files?.[0]?.thumbUrl,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
