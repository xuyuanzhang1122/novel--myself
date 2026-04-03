import { cn } from "@xu-novel/ui";

type ViewMode = "login" | "register";

type AuthStageProps = {
  className?: string;
  email: string;
  registerMessage: string | null;
  sendCooldown: number;
  viewMode: ViewMode;
  codeMessage: string | null;
};

export function AuthStage({
  className,
  email,
  registerMessage,
  sendCooldown,
  viewMode,
  codeMessage,
}: AuthStageProps) {
  const normalizedEmail = email.trim();
  const hasEmail = normalizedEmail.length > 0;
  const hasCode = Boolean(codeMessage);
  const isRegistered = Boolean(registerMessage);
  const progress =
    viewMode === "login" ? 3 : isRegistered ? 3 : hasCode ? 2 : hasEmail ? 1 : 0;

  const title =
    viewMode === "register" ? "注册就该一屏完成。" : "不用绕路，直接继续读。";
  const description =
    viewMode === "register"
      ? "这里不是说明书。邮箱、验证码、密码，完成后直接进入书库。"
      : "已有账号的话，只保留一件事: 输入邮箱和密码，然后回到阅读。";
  const statusText =
    viewMode === "register"
      ? isRegistered
        ? "账号已解锁，正在进入书库。"
        : hasCode
          ? sendCooldown > 0
            ? `${sendCooldown} 秒后可重新发送验证码。`
            : "验证码已送达，等待完成验证。"
          : hasEmail
            ? "邮箱已准备好，可以发送验证码。"
            : "先输入一个能接收邮件的地址。"
      : "输入邮箱和密码后即可回到书库。";
  const centerLabel =
    viewMode === "register"
      ? isRegistered
        ? "已验证"
        : hasCode
          ? "验证码"
          : hasEmail
            ? "待发码"
            : "邮箱"
      : "登录";
  const centerWord =
    viewMode === "register"
      ? isRegistered
        ? "进入"
        : hasCode
          ? "验证"
          : hasEmail
            ? "准备"
            : "输入"
      : "回到";
  const centerDescription =
    viewMode === "register"
      ? isRegistered
        ? "账号已准备完成跳转。"
        : hasCode
          ? "填入验证码与密码。"
          : hasEmail
            ? "右侧按钮现在可以发码。"
            : "先从邮箱开始。"
      : "邮箱和密码通过后，直接进入书库。";
  const steps =
    viewMode === "register"
      ? ["邮箱", "验证码", "进入书库"]
      : ["邮箱", "密码", "进入书库"];

  return (
    <section className={cn("order-2 lg:order-1", className)}>
      <div className="relative h-full overflow-hidden rounded-[2.35rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.18),transparent_26%),linear-gradient(160deg,rgba(18,18,18,0.94),rgba(8,8,8,0.98))] p-5 sm:p-6 lg:min-h-[calc(100vh-4rem)] lg:p-8">
        <div className="auth-grid-drift absolute inset-0 opacity-35" />
        <div className="auth-float absolute left-[10%] top-[14%] h-36 w-36 rounded-full bg-amber-300/12 blur-3xl" />
        <div className="auth-float-delayed absolute bottom-[10%] right-[12%] h-44 w-44 rounded-full bg-orange-400/10 blur-3xl" />

        <div className="relative flex h-full flex-col justify-between gap-6">
          <div className="space-y-4">
            <p className="text-[11px] uppercase tracking-[0.34em] text-amber-100/70">
              {viewMode === "register" ? "邮箱注册" : "密码登录"}
            </p>
            <div className="space-y-3">
              <h1 className="max-w-[10ch] font-serif text-4xl leading-[0.9] tracking-tight text-stone-50 sm:text-5xl lg:text-7xl">
                {title}
              </h1>
              <p className="max-w-xl text-sm leading-7 text-stone-300 sm:text-base sm:leading-8">
                {description}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {steps.map((step, index) => {
                const active = progress >= index + 1;
                return (
                  <span
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-[11px] tracking-[0.22em] transition",
                      active
                        ? "border-amber-200/40 bg-amber-200/14 text-amber-50"
                        : "border-white/10 bg-white/[0.04] text-stone-400",
                    )}
                    key={step}
                  >
                    {step}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="relative flex flex-1 items-center justify-center py-3 lg:py-8">
            <div className="group relative aspect-[1.06/1] w-full max-w-[580px]">
              <div className="auth-orbit absolute inset-[6%] rounded-full border border-white/10" />
              <div className="auth-orbit-reverse absolute inset-[17%] rounded-full border border-white/8" />
              <div className="absolute inset-[28%] rounded-full border border-amber-100/20" />

              <svg
                aria-hidden="true"
                className="absolute inset-0 h-full w-full"
                fill="none"
                viewBox="0 0 100 100"
              >
                <defs>
                  <linearGradient id="authStageRing" x1="10%" x2="90%" y1="10%" y2="90%">
                    <stop offset="0%" stopColor="rgba(251,191,36,0.05)" />
                    <stop offset="48%" stopColor="rgba(251,191,36,0.72)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.08)" />
                  </linearGradient>
                </defs>
                <circle
                  cx="50"
                  cy="50"
                  r="41"
                  stroke="url(#authStageRing)"
                  strokeDasharray="4 8"
                  strokeWidth="0.4"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="29"
                  stroke="rgba(255,255,255,0.14)"
                  strokeDasharray="2 5"
                  strokeWidth="0.35"
                />
                <path
                  d="M20 56C31.333 47.333 41.333 43 50 43C58.667 43 68.667 47.333 80 56"
                  stroke="rgba(251,191,36,0.35)"
                  strokeLinecap="round"
                  strokeWidth="0.6"
                />
                <path
                  d="M29 68C34.5 61.333 41.5 58 50 58C58.5 58 65.5 61.333 71 68"
                  stroke="rgba(255,255,255,0.12)"
                  strokeLinecap="round"
                  strokeWidth="0.4"
                />
              </svg>

              <SceneChip
                className="auth-float absolute left-[6%] top-[18%] w-[44%] max-w-[220px] group-hover:-translate-y-1"
                label={viewMode === "register" ? "收件邮箱" : "登录邮箱"}
                value={
                  viewMode === "register"
                    ? hasEmail
                      ? previewEmail(normalizedEmail)
                      : "name@domain.com"
                    : "reader@xu-novel.app"
                }
              />
              <SceneChip
                className="auth-float-delayed absolute right-[4%] top-[24%] w-[34%] max-w-[180px] group-hover:translate-y-1"
                label="实时状态"
                tone="accent"
                value={
                  viewMode === "register"
                    ? isRegistered
                      ? "已解锁"
                      : hasCode
                        ? sendCooldown > 0
                          ? `${sendCooldown}s`
                          : "可重发"
                        : hasEmail
                          ? "待发码"
                          : "等待输入"
                    : "密码校验"
                }
              />
              <SceneChip
                className="auth-float-slow absolute bottom-[16%] left-[10%] w-[32%] max-w-[160px] group-hover:-translate-x-1"
                label={viewMode === "register" ? "当前步骤" : "快捷入口"}
                value={
                  viewMode === "register"
                    ? progress === 0
                      ? "输入邮箱"
                      : progress === 1
                        ? "发送验证码"
                        : progress === 2
                          ? "提交注册"
                          : "进入书库"
                    : "密码登录"
                }
              />

              <div className="auth-pulse-soft absolute bottom-[12%] right-[12%] flex h-20 w-20 items-center justify-center rounded-full border border-amber-100/20 bg-amber-200/10 text-center text-[11px] tracking-[0.24em] text-amber-50 backdrop-blur">
                {viewMode === "register" ? (progress === 3 ? "DONE" : `0${Math.max(progress, 1)}`) : "GO"}
              </div>

              <div className="absolute left-1/2 top-1/2 h-[54%] w-[54%] -translate-x-1/2 -translate-y-1/2">
                <span className="auth-scan absolute left-1/2 top-0 h-16 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-amber-200/70 to-transparent" />
                <span className="auth-scan-delay absolute bottom-0 left-1/2 h-16 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/45 to-transparent" />
                <span className="auth-scan-reverse absolute left-0 top-1/2 h-px w-16 -translate-y-1/2 bg-gradient-to-r from-transparent via-amber-100/65 to-transparent" />
                <span className="auth-scan-delay absolute right-0 top-1/2 h-px w-16 -translate-y-1/2 bg-gradient-to-r from-transparent via-white/45 to-transparent" />
              </div>

              <div className="absolute inset-[33%] flex flex-col items-center justify-center rounded-full border border-white/10 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.16),rgba(11,11,11,0.95)_62%)] px-5 text-center shadow-[0_0_90px_-35px_rgba(245,158,11,0.55)] backdrop-blur-xl">
                <p className="text-[11px] uppercase tracking-[0.3em] text-amber-100/75">
                  {centerLabel}
                </p>
                <p className="mt-4 font-serif text-[2.4rem] leading-none text-stone-50 sm:text-[3.4rem]">
                  {centerWord}
                </p>
                <p className="mt-3 max-w-[15ch] text-[11px] leading-5 text-stone-300 sm:text-xs">
                  {centerDescription}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-[1.4rem] border border-white/10 bg-black/20 px-4 py-4 backdrop-blur sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-[0.24em] text-stone-500">
                {viewMode === "register" ? "收件邮箱" : "当前入口"}
              </p>
              <p className="mt-2 truncate text-sm text-stone-100">
                {viewMode === "register"
                  ? hasEmail
                    ? normalizedEmail
                    : "还没有填写邮箱"
                  : "已有账号，直接登录"}
              </p>
            </div>
            <div className="h-px w-full bg-white/10 sm:h-10 sm:w-px" />
            <div className="flex-1">
              <p className="text-[11px] uppercase tracking-[0.24em] text-stone-500">实时状态</p>
              <p className="mt-2 text-sm leading-6 text-amber-100">{statusText}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SceneChip({
  className,
  label,
  value,
  tone = "default",
}: {
  className?: string;
  label: string;
  value: string;
  tone?: "default" | "accent";
}) {
  return (
    <div
      className={cn(
        "rounded-[1.3rem] border px-4 py-3 backdrop-blur-xl transition-transform duration-500",
        tone === "accent"
          ? "border-amber-100/20 bg-amber-100/10 text-amber-50"
          : "border-white/10 bg-black/25 text-stone-100",
        className,
      )}
    >
      <p className="text-[10px] uppercase tracking-[0.24em] text-stone-400">{label}</p>
      <p className="mt-2 truncate text-sm">{value}</p>
    </div>
  );
}

function previewEmail(value: string) {
  if (!value) return "name@domain.com";

  const [localPart, domainPart] = value.split("@");
  if (!domainPart) return value;

  if (localPart.length <= 3) {
    return `${localPart}@${domainPart}`;
  }

  return `${localPart.slice(0, 2)}••${localPart.slice(-1)}@${domainPart}`;
}
