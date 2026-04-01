"use server";

import { redirect } from "next/navigation";

import { signInWithPassword, signOut } from "@xu-novel/lib";

type AuthActionState = {
  error: string | null;
};

function normalizeRedirect(target: string | null, fallback: string) {
  if (!target || !target.startsWith("/") || target.startsWith("//")) {
    return fallback;
  }
  return target;
}

export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const result = await signInWithPassword(
    formData.get("email")?.toString() ?? "",
    formData.get("password")?.toString() ?? "",
  );

  if (!result.ok) {
    return { error: result.error };
  }

  redirect(
    normalizeRedirect(formData.get("redirect_to")?.toString() ?? null, "/dashboard"),
  );
}

export async function signOutAction() {
  await signOut();
  redirect("/login");
}
