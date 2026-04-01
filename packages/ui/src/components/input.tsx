import * as React from "react";

import { cn } from "../lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-2xl border border-stone-300 bg-white/80 px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-500 focus:border-stone-500 dark:border-stone-700 dark:bg-stone-900/70 dark:text-stone-100 dark:placeholder:text-stone-400",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";
