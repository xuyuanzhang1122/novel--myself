import { redirect } from "next/navigation";

import { getAuthDefaults, getUser } from "@xu-novel/lib";

import { SignInForm } from "./signin-form";

function getRedirectTarget(pathname?: string) {
  if (!pathname || !pathname.startsWith("/") || pathname.startsWith("//")) {
    return "/dashboard";
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

  const defaults = getAuthDefaults();

  return (
    <div className="flex h-screen items-center justify-center bg-stone-950 px-4 sm:px-0">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="font-serif text-3xl font-bold tracking-tighter text-stone-100">
            管理员登入
          </h1>
          <p className="text-stone-400 text-sm">
            请输入管理邮箱和密码继续
          </p>
        </div>
        <SignInForm
          defaultEmail={defaults.email}
          passwordHint={defaults.passwordHint}
          redirectTo={getRedirectTarget(params.redirectedFrom)}
        />
      </div>
    </div>
  );
}
