import Link from "next/link";

import { getUser } from "@xu-novel/lib";
import { Button } from "@xu-novel/ui";

import { signOutAction } from "./auth-actions";

type SiteShellProps = {
  children: React.ReactNode;
  heading?: string;
  subheading?: string;
};

export async function SiteShell({ children, heading, subheading }: SiteShellProps) {
  const user = await getUser();

  return (
    <main className="min-h-screen px-5 py-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-5 rounded-[2rem] border border-stone-200/70 bg-white/65 px-6 py-5 backdrop-blur md:flex-row md:items-start md:justify-between dark:border-stone-800/80 dark:bg-stone-950/60">
          <div className="space-y-4">
            <div className="space-y-1">
              <Link href="/" className="font-serif text-3xl tracking-tight">
                xu-novel
              </Link>
              {heading ? (
                <div className="space-y-1">
                  <p className="text-sm uppercase tracking-[0.22em] text-stone-500">{heading}</p>
                  {subheading ? <p className="text-sm text-stone-600 dark:text-stone-300">{subheading}</p> : null}
                </div>
              ) : null}
            </div>
            <nav className="flex flex-wrap items-center gap-2">
              <Link href="/library">
                <Button variant="ghost">书库</Button>
              </Link>
              <Link href="/settings">
                <Button variant="ghost">设置</Button>
              </Link>
            </nav>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 md:max-w-sm">
            {user ? (
              <>
                <span className="rounded-full border border-stone-300/80 px-4 py-2 text-sm text-stone-600 dark:border-stone-700/80 dark:text-stone-300">
                  {user.email}
                </span>
                <form action={signOutAction}>
                  <Button type="submit" variant="secondary">
                    退出登录
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">登录</Button>
                </Link>
                <Link href="/login#register">
                  <Button variant="secondary">注册</Button>
                </Link>
              </>
            )}
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}
