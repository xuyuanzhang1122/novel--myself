"use client";

import { useState, useTransition } from "react";

export function FormWithError({
  action,
  children,
  className,
}: {
  action: (formData: FormData) => Promise<void>;
  children: React.ReactNode;
  className?: string;
}) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className={className}
      action={(formData) => {
        setError("");
        startTransition(async () => {
          try {
            await action(formData);
          } catch (e: any) {
            setError(e?.message ?? "操作失败，请重试。");
          }
        });
      }}
    >
      {children}
      {error && (
        <p className="mt-2 rounded-xl bg-amber-950/30 px-4 py-2 text-sm text-amber-300">
          {error}
        </p>
      )}
    </form>
  );
}
