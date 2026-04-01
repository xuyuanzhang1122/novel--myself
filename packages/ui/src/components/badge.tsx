import { cn } from "../lib/utils";

type BadgeProps = {
  children: React.ReactNode;
  className?: string;
};

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-stone-300/80 px-3 py-1 text-xs uppercase tracking-[0.18em] text-stone-600 dark:border-stone-700 dark:text-stone-300",
        className,
      )}
    >
      {children}
    </span>
  );
}
