import * as React from "react";

import { cn } from "../lib/utils";

type PanelProps = React.HTMLAttributes<HTMLDivElement> & {
  tone?: "default" | "ink" | "paper";
};

export function Panel({ className, tone = "default", ...props }: PanelProps) {
  return (
    <div
      className={cn(
        "rounded-[2rem] border p-6 shadow-[0_20px_60px_-30px_rgba(24,24,27,0.35)] backdrop-blur",
        tone === "default" &&
          "border-stone-200/80 bg-white/75 dark:border-stone-800/80 dark:bg-stone-950/60",
        tone === "ink" &&
          "border-stone-800/80 bg-stone-950 text-stone-100",
        tone === "paper" &&
          "border-amber-200/70 bg-[linear-gradient(135deg,rgba(255,251,235,0.95),rgba(245,236,211,0.9))]",
        className,
      )}
      {...props}
    />
  );
}
