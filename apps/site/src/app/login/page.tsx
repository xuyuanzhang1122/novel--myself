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
    <main className="relative min-h-screen overflow-hidden bg-stone-950 px-4 py-6 text-stone-50 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.18),transparent_32%),linear-gradient(180deg,rgba(28,25,23,0.82),rgba(10,10,10,0.98))]" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22240%22 height=%22240%22 viewBox=%220 0 240 240%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.78%22 numOctaves=%222%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22240%22 height=%22240%22 filter=%22url(%23n)%22 opacity=%220.09%22/%3E%3C/svg%3E')]" />
      <div className="relative mx-auto grid max-w-6xl gap-8 lg:min-h-[calc(100vh-5rem)] lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
        <div className="space-y-6 rounded-[2rem] border border-white/8 bg-black/20 p-6 backdrop-blur sm:p-8 lg:min-h-[520px] lg:border-none lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.35em] text-stone-400">账号入口</p>
            <h1 className="max-w-[8ch] font-serif text-5xl leading-[0.88] tracking-tight sm:text-7xl lg:text-8xl">
              xu-novel
            </h1>
          </div>
          <p className="max-w-xl text-base leading-8 text-stone-300 sm:text-lg sm:leading-9">
            前台首页只保留预览。登录后进入书库、作品详情和章节阅读，新用户通过邮箱验证码完成注册。
          </p>
          <div className="grid gap-3 text-sm text-stone-300 sm:max-w-lg sm:grid-cols-3">
            {[
              ["游客", "只能看首页预览"],
              ["登录后", "进入书库与阅读器"],
              ["新用户", "邮箱验证码注册"],
            ].map(([title, description]) => (
              <div
                className="rounded-[1.4rem] border border-white/10 bg-white/5 px-4 py-4"
                key={title}
              >
                <p className="text-[11px] uppercase tracking-[0.24em] text-stone-500">{title}</p>
                <p className="mt-2 leading-6 text-stone-300">{description}</p>
              </div>
            ))}
          </div>
        </div>
        <LoginForm
          redirectTo={getRedirectTarget(params.redirectedFrom)}
        />
      </div>
    </main>
  );
}
