"use server";

import { redirect } from "next/navigation";

import {
  createUser,
  deleteUser,
  getAdminUser,
  updateUserRole,
  type UserRole,
} from "@xu-novel/lib";

import type { AdminActionResult } from "../action-result";

function normalizeRole(value: FormDataEntryValue | null): UserRole {
  return value?.toString() === "ADMIN" ? "ADMIN" : "USER";
}

export async function createUserAction(formData: FormData): Promise<AdminActionResult> {
  const user = await getAdminUser();
  if (!user) {
    redirect("/login?redirectedFrom=/users");
  }

  await createUser({
    email: formData.get("email")?.toString() ?? "",
    password: formData.get("password")?.toString() ?? "",
    role: normalizeRole(formData.get("role")),
  });

  return {
    ok: true,
    message: "用户已创建。",
  };
}

export async function updateUserRoleAction(formData: FormData): Promise<AdminActionResult> {
  const user = await getAdminUser();
  if (!user) {
    redirect("/login?redirectedFrom=/users");
  }

  await updateUserRole(
    formData.get("user_id")?.toString() ?? "",
    normalizeRole(formData.get("role")),
  );

  return {
    ok: true,
    message: "权限已更新。",
  };
}

export async function deleteUserAction(formData: FormData): Promise<AdminActionResult> {
  const user = await getAdminUser();
  if (!user) {
    redirect("/login?redirectedFrom=/users");
  }

  await deleteUser(formData.get("user_id")?.toString() ?? "", user.id);

  return {
    ok: true,
    message: "用户已删除。",
  };
}
