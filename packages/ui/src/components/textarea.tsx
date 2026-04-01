import * as React from "react";

import { cn } from "../lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-28 w-full rounded-3xl border border-stone-300 bg-white/80 px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-500 focus:border-stone-500 dark:border-stone-700 dark:bg-stone-900/70 dark:text-stone-100 dark:placeholder:text-stone-400",
      className,
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";
