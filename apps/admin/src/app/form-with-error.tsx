"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { AdminActionResult } from "./action-result";
import { getRedirectTargetFromError } from "./action-result";

export function FormWithError({
  action,
  children,
  className,
  successMessage,
}: {
  action: (formData: FormData) => Promise<AdminActionResult | void>;
  children: React.ReactNode;
  className?: string;
  successMessage?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className={className}
      action={(formData) => {
        setError("");
        setSuccess("");
        startTransition(async () => {
          try {
            const result = await action(formData);
            setSuccess(result?.message ?? successMessage ?? "操作成功。");

            if (result?.redirectTo) {
              router.push(result.redirectTo);
              return;
            }

            router.refresh();
          } catch (e: any) {
            const redirectTo = getRedirectTargetFromError(e);
            if (redirectTo) {
              router.push(redirectTo);
              return;
            }
            setError(e?.message ?? "操作失败，请重试。");
          }
        });
      }}
    >
      {children}
      {success && (
        <p className="mt-2 rounded-xl bg-emerald-950/30 px-4 py-2 text-sm text-emerald-300">
          {isPending ? "处理中..." : success}
        </p>
      )}
      {error && (
        <p className="mt-2 rounded-xl bg-amber-950/30 px-4 py-2 text-sm text-amber-300">
          {error}
        </p>
      )}
    </form>
  );
}
