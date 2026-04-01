import { cn } from "../lib/utils";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {eyebrow ? (
        <p className="text-xs uppercase tracking-[0.28em] text-stone-500 dark:text-stone-400">
          {eyebrow}
        </p>
      ) : null}
      <div className="space-y-3">
        <h2 className="font-serif text-3xl tracking-tight text-stone-950 dark:text-stone-50">
          {title}
        </h2>
        {description ? (
          <p className="max-w-2xl text-sm leading-7 text-stone-600 dark:text-stone-300">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
