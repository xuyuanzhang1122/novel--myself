"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button, cn } from "@xu-novel/ui";

import { signOutAction } from "./auth-actions";

const navItems = [
  { href: "/dashboard", label: "概览" },
  { href: "/novels", label: "作品" },
  { href: "/imports", label: "导入" },
  { href: "/appearance", label: "外观" },
];

export function AdminShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: React.ReactNode;
  subtitle: string;
}) {
  return (
    <main className="min-h-screen px-4 py-4 md:px-6">
      <div className="mx-auto grid max-w-[1700px] gap-4 lg:grid-cols-[260px_minmax(0,1fr)_300px]">
        <aside className="rounded-[2rem] border border-stone-800 bg-stone-900/80 p-5">
          <div className="space-y-1 px-3 py-2">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">工作台</p>
            <h1 className="font-serif text-3xl tracking-tight">xu-novel</h1>
          </div>
          <nav className="mt-8 space-y-1">
            {navItems.map((item) => (
              <NavLink href={item.href} key={item.href}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-8 px-3">
            <a href={process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}>
              <Button className="w-full" variant="secondary">
                打开前台
              </Button>
            </a>
            <form action={signOutAction} className="mt-3">
              <Button className="w-full" variant="ghost">
                退出登录
              </Button>
            </form>
          </div>
        </aside>
        <section className="rounded-[2rem] border border-stone-800 bg-stone-950/85 p-6">
          <header className="mb-8 space-y-2">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">编辑界面</p>
            <h2 className="font-serif text-4xl tracking-tight">{title}</h2>
            <p className="text-sm leading-7 text-stone-400">{subtitle}</p>
          </header>
          {children}
        </section>
        <aside className="rounded-[2rem] border border-stone-800 bg-stone-900/80 p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-stone-500">检查面板</p>
          <div className="mt-5 space-y-4 text-sm leading-7 text-stone-300">
            <p>共享主域 Cookie 保持双应用登录态。</p>
            <p>章节与外观更新通过受保护的 revalidate API 刷新前台 tag 缓存。</p>
            <p>Markdown 是唯一真源，HTML 仅作缓存与渲染产物。</p>
          </div>
        </aside>
      </div>
    </main>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={cn(
        "block rounded-2xl px-3 py-2 text-sm text-stone-400 transition hover:bg-stone-800 hover:text-stone-100",
        active && "bg-stone-100 text-stone-950 hover:bg-stone-100 hover:text-stone-950",
      )}
    >
      {children}
    </Link>
  );
}
