"use server";

import { redirect } from "next/navigation";

import { getUser, saveReaderPreference } from "@xu-novel/lib";

function pickValue<T extends string>(
  value: FormDataEntryValue | null,
  allowed: readonly T[],
  fallback: T,
) {
  const normalized = value?.toString() as T | undefined;
  return normalized && allowed.includes(normalized) ? normalized : fallback;
}

function clampNumber(
  value: FormDataEntryValue | null,
  min: number,
  max: number,
  fallback: number,
) {
  const parsed = Number(value?.toString());
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export async function saveReaderPreferenceAction(formData: FormData) {
  const user = await getUser();
  if (!user) {
    redirect("/login?redirectedFrom=/settings");
  }

  await saveReaderPreference(user.id, {
    font_family: pickValue(
      formData.get("font_family"),
      ["serif", "song", "sans"] as const,
      "serif",
    ),
    font_scale: clampNumber(formData.get("font_scale"), 0.9, 1.6, 1),
    page_width: pickValue(
      formData.get("page_width"),
      ["narrow", "standard", "wide"] as const,
      "standard",
    ),
    theme: pickValue(
      formData.get("theme"),
      ["paper", "night", "mist"] as const,
      "paper",
    ),
    background_tone: null,
  });

  redirect("/settings?saved=1");
}
