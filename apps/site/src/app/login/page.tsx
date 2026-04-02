import { redirect } from "next/navigation";

import { getUser } from "@xu-novel/lib";

import { LoginForm } from "./login-form";

function getRedirectTarget(pathname?: string) {
  if (!pathname || !pathname.startsWith("/") || pathname.startsWith("//")) {
    return "/library";
  }
  return pathname;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectedFrom?: string }>;
}) {
  const [params, user] = await Promise.all([searchParams, getUser()]);
  if (user) {
    redirect(getRedirectTarget(params.redirectedFrom));
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-stone-950 px-6 py-10 text-stone-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.18),transparent_32%),linear-gradient(180deg,rgba(28,25,23,0.82),rgba(10,10,10,0.98))]" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22240%22 height=%22240%22 viewBox=%220 0 240 240%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.78%22 numOctaves=%222%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22240%22 height=%22240%22 filter=%22url(%23n)%22 opacity=%220.09%22/%3E%3C/svg%3E')]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-center justify-between gap-12">
        <div className="max-w-2xl space-y-8">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-400">账号入口</p>
          <h1 className="font-serif text-6xl leading-none tracking-tight md:text-8xl">
            xu-novel
          </h1>
          <p className="max-w-xl text-lg leading-9 text-stone-300">
            前台首页只保留预览。登录后进入书库、作品详情和章节阅读；新用户通过邮箱验证码完成注册。
          </p>
        </div>
        <LoginForm
          redirectTo={getRedirectTarget(params.redirectedFrom)}
        />
      </div>
    </main>
  );
}
