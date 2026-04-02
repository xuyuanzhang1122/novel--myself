"use server";

import { redirect } from "next/navigation";

import {
  registerUserWithCode,
  sendRegistrationCode,
  signInWithPassword,
  signOut,
} from "@xu-novel/lib";

export type AuthFormState = {
  error: string | null;
  message: string | null;
};

function normalizeRedirect(target: string | null, fallback: string) {
  if (!target || !target.startsWith("/") || target.startsWith("//")) {
    return fallback;
  }
  return target;
}

export async function signInAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const result = await signInWithPassword(
    formData.get("email")?.toString() ?? "",
    formData.get("password")?.toString() ?? "",
  );

  if (!result.ok) {
    return { error: result.error, message: null };
  }

  redirect(
    normalizeRedirect(formData.get("redirect_to")?.toString() ?? null, "/library"),
  );
}

export async function sendRegisterCodeAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  try {
    const result = await sendRegistrationCode(formData.get("email")?.toString() ?? "");
    return {
      error: null,
      message: result.message,
    };
  } catch (error: any) {
    return {
      error: error?.message ?? "验证码发送失败，请重试。",
      message: null,
    };
  }
}

export async function registerAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const password = formData.get("password")?.toString() ?? "";
  const confirmPassword = formData.get("confirm_password")?.toString() ?? "";

  if (password !== confirmPassword) {
    return {
      error: "两次输入的密码不一致。",
      message: null,
    };
  }

  try {
    await registerUserWithCode({
      email: formData.get("email")?.toString() ?? "",
      code: formData.get("code")?.toString() ?? "",
      password,
    });
  } catch (error: any) {
    return {
      error: error?.message ?? "注册失败，请稍后重试。",
      message: null,
    };
  }

  const signInResult = await signInWithPassword(
    formData.get("email")?.toString() ?? "",
    password,
  );

  if (!signInResult.ok) {
    return {
      error: signInResult.error,
      message: null,
    };
  }

  redirect(
    normalizeRedirect(formData.get("redirect_to")?.toString() ?? null, "/library"),
  );
}

export async function signOutAction() {
  await signOut();
  redirect("/");
}
