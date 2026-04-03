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
    <main className="relative min-h-screen overflow-hidden bg-stone-950 text-stone-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.2),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.12),transparent_24%),linear-gradient(180deg,rgba(28,25,23,0.82),rgba(10,10,10,0.99))]" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22240%22 height=%22240%22 viewBox=%220 0 240 240%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.78%22 numOctaves=%222%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22240%22 height=%22240%22 filter=%22url(%23n)%22 opacity=%220.09%22/%3E%3C/svg%3E')]" />
      <div className="absolute left-[-10%] top-[18%] h-72 w-72 rounded-full bg-amber-300/10 blur-3xl" />
      <div className="absolute bottom-[-8%] right-[-8%] h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="relative px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <LoginForm redirectTo={getRedirectTarget(params.redirectedFrom)} />
      </div>
    </main>
  );
}
