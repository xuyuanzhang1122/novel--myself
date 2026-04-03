"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button, cn } from "@xu-novel/ui";

import { signOutAction } from "./auth-actions";

const navItems = [
  { href: "/dashboard", label: "概览", summary: "看作品、导入和发布状态" },
  { href: "/novels", label: "作品", summary: "管理作品与章节" },
  { href: "/imports", label: "导入", summary: "处理 Word 转换队列" },
  { href: "/appearance", label: "外观", summary: "调整前台品牌和背景" },
  { href: "/users", label: "用户", summary: "改权限、重置密码、删号" },
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.08),transparent_22%),linear-gradient(180deg,#0f0f10,#09090b)] px-4 py-4 md:px-6">
      <div className="mx-auto grid max-w-[1880px] gap-4 xl:grid-cols-[280px_minmax(0,1fr)] 2xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="h-fit rounded-[2rem] border border-stone-800 bg-stone-900/85 p-5 backdrop-blur xl:sticky xl:top-4 xl:self-start">
          <div className="space-y-2 rounded-[1.5rem] border border-stone-800/80 bg-stone-950/70 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">工作台</p>
            <h1 className="font-serif text-3xl tracking-tight">xu-novel</h1>
            <p className="text-sm leading-6 text-stone-400">后台不只是表单集合，而是内容生产和账号控制台。</p>
          </div>
          <nav className="mt-6 space-y-2">
            {navItems.map((item) => (
              <NavLink href={item.href} key={item.href} summary={item.summary}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-6 space-y-3 px-1">
            <a
              className="block"
              href={process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}
            >
              <Button className="w-full" variant="secondary">
                打开前台
              </Button>
            </a>
            <form action={signOutAction} className="mt-3">
              <Button className="w-full" type="submit" variant="ghost">
                退出登录
              </Button>
            </form>
          </div>
        </aside>
        <section className="min-w-0 rounded-[2rem] border border-stone-800 bg-stone-950/90 p-6 backdrop-blur">
          <header className="mb-8 space-y-3 rounded-[1.75rem] border border-stone-800/80 bg-stone-900/50 px-5 py-5">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">编辑界面</p>
            <h2 className="font-serif text-4xl tracking-tight">{title}</h2>
            <p className="text-sm leading-7 text-stone-400">{subtitle}</p>
          </header>
          {children}
        </section>
        <ControlRail />
      </div>
    </main>
  );
}

function NavLink({
  href,
  children,
  summary,
}: {
  href: string;
  children: React.ReactNode;
  summary: string;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={cn(
        "block rounded-[1.4rem] border border-transparent px-4 py-3 text-sm transition hover:border-stone-700 hover:bg-stone-800/70 hover:text-stone-100",
        active &&
          "border-amber-200/20 bg-amber-100 text-stone-950 shadow-[0_18px_38px_-26px_rgba(251,191,36,0.55)] hover:border-amber-200/20 hover:bg-amber-100 hover:text-stone-950",
      )}
    >
      <p className="font-medium tracking-[0.02em]">{children}</p>
      <p className={cn("mt-1 text-xs leading-5 text-stone-500", active && "text-stone-700")}>
        {summary}
      </p>
    </Link>
  );
}

function ControlRail() {
  const pathname = usePathname();
  const currentSection =
    navItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)) ??
    navItems[0];

  return (
    <aside className="h-fit rounded-[2rem] border border-stone-800 bg-stone-900/85 p-5 backdrop-blur xl:col-span-2 2xl:col-span-1 2xl:sticky 2xl:top-4 2xl:self-start">
      <div className="rounded-[1.5rem] border border-stone-800/80 bg-stone-950/70 px-4 py-4">
        <p className="text-xs uppercase tracking-[0.28em] text-stone-500">当前区域</p>
        <h3 className="mt-2 font-serif text-3xl tracking-tight">{currentSection.label}</h3>
        <p className="mt-2 text-sm leading-6 text-stone-400">{currentSection.summary}</p>
      </div>

      <div className="mt-5 space-y-3">
        <p className="text-xs uppercase tracking-[0.28em] text-stone-500">快捷入口</p>
        <QuickLink href="/novels">继续编辑作品</QuickLink>
        <QuickLink href="/imports">查看导入队列</QuickLink>
        <QuickLink href="/users">管理账号权限</QuickLink>
      </div>

      <div className="mt-6 space-y-4 rounded-[1.5rem] border border-stone-800/80 bg-stone-950/70 px-4 py-4 text-sm leading-7 text-stone-300">
        <p className="text-xs uppercase tracking-[0.28em] text-stone-500">操作基线</p>
        <p>共享主域 Cookie 保持双应用登录态。</p>
        <p>章节和外观更新都会通过受保护的 revalidate API 刷新前台缓存。</p>
        <p>Markdown 是唯一真源，预览 HTML 只是阅读产物。</p>
      </div>
    </aside>
  );
}

function QuickLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      className="block rounded-[1.3rem] border border-stone-800 bg-stone-950/70 px-4 py-3 text-sm text-stone-300 transition hover:-translate-y-0.5 hover:border-stone-700 hover:bg-stone-900 hover:text-stone-100"
      href={href}
    >
      {children}
    </Link>
  );
}
