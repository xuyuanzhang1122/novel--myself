import Link from "next/link";

import { Badge } from "./badge";
import { Button } from "./button";
import { cn } from "../lib/utils";

type PosterHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryActionLabel: string;
  primaryActionHref?: string;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  className?: string;
};

function ActionButton({
  href,
  label,
  variant = "primary",
}: {
  href?: string;
  label: string;
  variant?: "primary" | "secondary";
}) {
  if (!href) {
    return <Button variant={variant}>{label}</Button>;
  }

  if (href.startsWith("http://") || href.startsWith("https://")) {
    return (
      <a href={href}>
        <Button variant={variant}>{label}</Button>
      </a>
    );
  }

  return (
    <Link href={href}>
      <Button variant={variant}>{label}</Button>
    </Link>
  );
}

export function PosterHero({
  eyebrow,
  title,
  description,
  primaryActionLabel,
  primaryActionHref,
  secondaryActionLabel,
  secondaryActionHref,
  className,
}: PosterHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[3rem] border border-stone-200/70 bg-[radial-gradient(circle_at_top,rgba(191,219,254,0.12),transparent_30%),linear-gradient(135deg,rgba(17,24,39,0.98),rgba(68,64,60,0.92))] px-8 py-12 text-stone-50 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.65)] md:px-12 md:py-16",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22240%22 height=%22240%22 viewBox=%220 0 240 240%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.78%22 numOctaves=%222%22 stitchTiles=%22stitch%22 /%3E%3C/filter%3E%3Crect width=%22240%22 height=%22240%22 filter=%22url(%23n)%22 opacity=%220.08%22 /%3E%3C/svg%3E')] opacity-60" />
      <div className="relative max-w-3xl space-y-7">
        <Badge className="border-stone-500/40 text-stone-300">{eyebrow}</Badge>
        <div className="space-y-5">
          <h1 className="font-serif text-5xl leading-none tracking-tight md:text-7xl">
            {title}
          </h1>
          <p className="max-w-xl text-base leading-8 text-stone-300 md:text-lg">
            {description}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ActionButton href={primaryActionHref} label={primaryActionLabel} />
          {secondaryActionLabel ? (
            <ActionButton
              href={secondaryActionHref}
              label={secondaryActionLabel}
              variant="secondary"
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
