"use client";

import { useEffect, useState, useActionState } from "react";
import type { ChangeEvent } from "react";
import { useFormStatus } from "react-dom";

import { Button, Input, Panel } from "@xu-novel/ui";

import {
  type AuthFormState,
  registerAction,
  sendRegisterCodeAction,
  signInAction,
} from "../auth-actions";

const initialState: AuthFormState = {
  error: null,
  message: null,
};

type ViewMode = "login" | "register";

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [viewMode, setViewMode] = useState<ViewMode>("login");
  const [registerEmail, setRegisterEmail] = useState("");
  const [sendCooldown, setSendCooldown] = useState(0);
  const [loginState, loginFormAction] = useActionState(signInAction, initialState);
  const [codeState, sendCodeFormAction] = useActionState(sendRegisterCodeAction, initialState);
  const [registerState, registerFormAction] = useActionState(registerAction, initialState);

  useEffect(() => {
    if (window.location.hash === "#register") {
      setViewMode("register");
    }
  }, []);

  useEffect(() => {
    if (registerState.message) {
      setViewMode("register");
    }
  }, [registerState.message]);

  useEffect(() => {
    if (codeState.message || codeState.error) {
      setViewMode("register");
    }
  }, [codeState.error, codeState.message]);

  useEffect(() => {
    if (!codeState.message) return;
    setSendCooldown(60);
  }, [codeState.message]);

  useEffect(() => {
    if (!codeState.error) return;
    const matchedSeconds = codeState.error.match(/(\d+)\s*秒后/);
    if (!matchedSeconds) return;
    setSendCooldown(Math.max(Number(matchedSeconds[1] ?? 0), 0));
  }, [codeState.error]);

  useEffect(() => {
    if (sendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setSendCooldown((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [sendCooldown]);

  return (
    <Panel
      id={viewMode === "register" ? "register" : undefined}
      className="w-full max-w-[430px] space-y-6 rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(20,18,16,0.94),rgba(10,10,10,0.98))] p-5 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)] sm:p-6"
      tone="ink"
    >
      {viewMode === "login" ? (
        <LoginCard
          loginFormAction={loginFormAction}
          loginState={loginState}
          onSwitchToRegister={() => setViewMode("register")}
          redirectTo={redirectTo}
        />
      ) : (
        <RegisterCard
          codeState={codeState}
          email={registerEmail}
          onEmailChange={(event) => setRegisterEmail(event.target.value)}
          onSwitchToLogin={() => setViewMode("login")}
          redirectTo={redirectTo}
          registerFormAction={registerFormAction}
          registerState={registerState}
          sendCooldown={sendCooldown}
          sendCodeFormAction={sendCodeFormAction}
        />
      )}
    </Panel>
  );
}

function LoginCard({
  redirectTo,
  loginState,
  loginFormAction,
  onSwitchToRegister,
}: {
  redirectTo?: string;
  loginState: AuthFormState;
  loginFormAction: (payload: FormData) => void;
  onSwitchToRegister: () => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.3em] text-stone-500">登录</p>
        <h2 className="font-serif text-3xl tracking-tight text-stone-50 sm:text-[2.25rem]">
          进入书库
        </h2>
        <p className="text-sm leading-7 text-stone-300">
          使用邮箱和密码登录后，才能进入作品详情、章节目录与阅读器。
        </p>
      </div>

      <form action={loginFormAction} className="space-y-4">
        <input name="redirect_to" type="hidden" value={redirectTo ?? "/library"} />
        <Input
          autoComplete="email"
          className="rounded-[1.35rem] border-white/10 bg-white/[0.06] px-4 py-3.5 text-stone-100 placeholder:text-stone-500 dark:border-white/10 dark:bg-white/[0.06]"
          name="email"
          placeholder="邮箱"
          required
          type="email"
        />
        <Input
          autoComplete="current-password"
          className="rounded-[1.35rem] border-white/10 bg-white/[0.06] px-4 py-3.5 text-stone-100 placeholder:text-stone-500 dark:border-white/10 dark:bg-white/[0.06]"
          name="password"
          placeholder="密码"
          required
          type="password"
        />
        {loginState.error ? <FormMessage tone="error">{loginState.error}</FormMessage> : null}
        <SubmitButton
          className="w-full rounded-[1.35rem] py-3.5"
          pendingText="登录中..."
          text="登录进入书库"
        />
      </form>

      <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-stone-300">
        <span className="text-stone-500">还没有账号？</span>{" "}
        <button
          className="font-medium text-stone-100 underline decoration-stone-500/60 underline-offset-4 transition hover:text-white"
          onClick={onSwitchToRegister}
          type="button"
        >
          注册
        </button>
      </div>
    </>
  );
}

function RegisterCard({
  redirectTo,
  codeState,
  email,
  registerState,
  sendCodeFormAction,
  registerFormAction,
  onSwitchToLogin,
  onEmailChange,
  sendCooldown,
}: {
  redirectTo?: string;
  codeState: AuthFormState;
  email: string;
  registerState: AuthFormState;
  sendCodeFormAction: (payload: FormData) => void;
  registerFormAction: (payload: FormData) => void;
  onSwitchToLogin: () => void;
  onEmailChange: (event: ChangeEvent<HTMLInputElement>) => void;
  sendCooldown: number;
}) {
  const normalizedEmail = email.trim();
  const hasEmail = normalizedEmail.length > 0;

  return (
    <>
      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.3em] text-stone-500">注册</p>
        <h2 className="font-serif text-3xl tracking-tight text-stone-50 sm:text-[2.25rem]">
          邮箱验证码注册
        </h2>
        <p className="text-sm leading-7 text-stone-300">
          先发送验证码，再填写验证码和密码完成注册。注册成功后会直接进入书库。
        </p>
      </div>

      <div className="space-y-5">
        <form action={sendCodeFormAction} className="space-y-3">
          <label className="block space-y-2">
            <span className="text-xs uppercase tracking-[0.24em] text-stone-500">发送验证码</span>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_148px]">
              <Input
                autoComplete="email"
                className="rounded-[1.35rem] border-white/10 bg-white/[0.06] px-4 py-3.5 text-stone-100 placeholder:text-stone-500 dark:border-white/10 dark:bg-white/[0.06]"
                name="email"
                placeholder="注册邮箱"
                required
                type="email"
                value={email}
                onChange={onEmailChange}
              />
              <CooldownSubmitButton
                className="w-full rounded-[1.35rem] py-3.5"
                cooldownSeconds={sendCooldown}
                disabled={!hasEmail}
                pendingText="发送中..."
                text="发送验证码"
                variant="secondary"
              />
            </div>
          </label>
          {codeState.message ? <FormMessage tone="success">{codeState.message}</FormMessage> : null}
          {codeState.error ? <FormMessage tone="error">{codeState.error}</FormMessage> : null}
        </form>

        <form action={registerFormAction} className="space-y-4">
          <input name="redirect_to" type="hidden" value={redirectTo ?? "/library"} />
          <input name="email" type="hidden" value={normalizedEmail} />
          <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-stone-500">注册邮箱</p>
            <p className="mt-2 text-sm leading-7 text-stone-200">
              {hasEmail ? normalizedEmail : "先在上方输入邮箱并发送验证码。"}
            </p>
          </div>
          <Input
            className="rounded-[1.35rem] border-white/10 bg-white/[0.06] px-4 py-3.5 text-stone-100 placeholder:text-stone-500 dark:border-white/10 dark:bg-white/[0.06]"
            inputMode="numeric"
            maxLength={6}
            name="code"
            placeholder="6 位邮箱验证码"
            required
            type="text"
          />
          <Input
            autoComplete="new-password"
            className="rounded-[1.35rem] border-white/10 bg-white/[0.06] px-4 py-3.5 text-stone-100 placeholder:text-stone-500 dark:border-white/10 dark:bg-white/[0.06]"
            name="password"
            placeholder="密码（至少 8 位）"
            required
            type="password"
          />
          <Input
            autoComplete="new-password"
            className="rounded-[1.35rem] border-white/10 bg-white/[0.06] px-4 py-3.5 text-stone-100 placeholder:text-stone-500 dark:border-white/10 dark:bg-white/[0.06]"
            name="confirm_password"
            placeholder="确认密码"
            required
            type="password"
          />
          {registerState.message ? (
            <FormMessage tone="success">{registerState.message}</FormMessage>
          ) : null}
          {registerState.error ? (
            <FormMessage tone="error">{registerState.error}</FormMessage>
          ) : null}
          <SubmitButton
            className="w-full rounded-[1.35rem] py-3.5"
            disabled={!hasEmail}
            pendingText="注册中..."
            text="完成注册并进入书库"
          />
        </form>
      </div>

      <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-stone-300">
        <span className="text-stone-500">已经有账号？</span>{" "}
        <button
          className="font-medium text-stone-100 underline decoration-stone-500/60 underline-offset-4 transition hover:text-white"
          onClick={onSwitchToLogin}
          type="button"
        >
          返回登录
        </button>
      </div>
    </>
  );
}

function FormMessage({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "error" | "success";
}) {
  return (
    <p
      className={
        tone === "error"
          ? "rounded-[1.2rem] border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"
          : "rounded-[1.2rem] border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
      }
    >
      {children}
    </p>
  );
}

function SubmitButton({
  text,
  pendingText,
  variant = "primary",
  className,
  disabled = false,
}: {
  text: string;
  pendingText: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button className={className ?? "w-full"} disabled={pending || disabled} type="submit" variant={variant}>
      {pending ? pendingText : text}
    </Button>
  );
}

function CooldownSubmitButton({
  cooldownSeconds,
  ...props
}: {
  cooldownSeconds: number;
  className?: string;
  disabled?: boolean;
  pendingText: string;
  text: string;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      className={props.className ?? "w-full"}
      disabled={pending || props.disabled || cooldownSeconds > 0}
      type="submit"
      variant={props.variant}
    >
      {pending
        ? props.pendingText
        : cooldownSeconds > 0
          ? `${cooldownSeconds} 秒后重发`
          : props.text}
    </Button>
  );
}
