import { timingSafeEqual } from "node:crypto";

import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import type { RevalidatePayload } from "@xu-novel/lib";

function safeCompare(input: string, expected?: string) {
  if (!expected || input.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(input), Buffer.from(expected));
}

export async function POST(request: Request) {
  const expectedSecret =
    process.env.SITE_REVALIDATE_SECRET || "xu-novel-local-revalidate-secret";
  const payload = (await request
    .json()
    .catch(() => null)) as RevalidatePayload | null;

  if (
    !payload ||
    typeof payload.secret !== "string" ||
    !Array.isArray(payload.tags) ||
    payload.tags.some((tag) => typeof tag !== "string")
  ) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!safeCompare(payload.secret, expectedSecret)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  payload.tags.forEach((tag) => revalidateTag(tag));

  return NextResponse.json({ ok: true, tags: payload.tags });
}
