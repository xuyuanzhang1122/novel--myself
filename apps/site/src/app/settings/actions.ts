"use server";

import { redirect } from "next/navigation";

import {
  changePassword,
  deleteOwnAccount,
  getUser,
  saveReaderPreference,
  signOut,
} from "@xu-novel/lib";

export type AccountActionState = {
  error: string | null;
  message: string | null;
};

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

export async function changePasswordAction(
  _prevState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const user = await getUser();
  if (!user) {
    redirect("/login?redirectedFrom=/settings");
  }

  const nextPassword = formData.get("next_password")?.toString() ?? "";
  const confirmPassword = formData.get("confirm_password")?.toString() ?? "";

  if (nextPassword !== confirmPassword) {
    return {
      error: "两次输入的新密码不一致。",
      message: null,
    };
  }

  try {
    await changePassword(
      user.id,
      formData.get("current_password")?.toString() ?? "",
      nextPassword,
    );

    return {
      error: null,
      message: "密码已更新。",
    };
  } catch (error: any) {
    return {
      error: error?.message ?? "密码更新失败，请稍后重试。",
      message: null,
    };
  }
}

export async function deleteAccountAction(
  _prevState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const user = await getUser();
  if (!user) {
    redirect("/login?redirectedFrom=/settings");
  }

  if ((formData.get("confirmation")?.toString() ?? "").trim() !== user.email) {
    return {
      error: "请输入当前邮箱以确认删除账号。",
      message: null,
    };
  }

  try {
    await deleteOwnAccount(user.id, formData.get("password")?.toString() ?? "");
    await signOut();
  } catch (error: any) {
    return {
      error: error?.message ?? "删除账号失败，请稍后重试。",
      message: null,
    };
  }

  redirect("/login");
}
