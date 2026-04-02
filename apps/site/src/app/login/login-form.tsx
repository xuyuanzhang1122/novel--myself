"use client";

import { useActionState } from "react";
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

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [loginState, loginFormAction] = useActionState(signInAction, initialState);
  const [codeState, sendCodeFormAction] = useActionState(sendRegisterCodeAction, initialState);
  const [registerState, registerFormAction] = useActionState(registerAction, initialState);

  return (
    <div className="grid w-full max-w-4xl gap-6 lg:grid-cols-2">
      <Panel tone="ink" className="space-y-6 border-stone-700/80 bg-stone-950/70">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.28em] text-stone-500">登录</p>
          <h2 className="font-serif text-3xl tracking-tight">进入书库</h2>
          <p className="text-sm leading-7 text-stone-300">
            使用邮箱和密码登录后，才能进入作品详情、章节目录与阅读器。
          </p>
        </div>
        <form action={loginFormAction} className="space-y-4">
          <input name="redirect_to" type="hidden" value={redirectTo ?? "/library"} />
          <Input
            autoComplete="email"
            name="email"
            placeholder="邮箱"
            required
            type="email"
          />
          <Input
            autoComplete="current-password"
            name="password"
            placeholder="密码"
            required
            type="password"
          />
          {loginState.error ? <FormMessage tone="error">{loginState.error}</FormMessage> : null}
          <SubmitButton pendingText="登录中..." text="登录进入书库" />
        </form>
      </Panel>

      <Panel
        id="register"
        className="space-y-6 border-stone-200/80 bg-white/90 text-stone-900"
      >
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.28em] text-stone-500">注册</p>
          <h2 className="font-serif text-3xl tracking-tight">邮箱验证码注册</h2>
          <p className="text-sm leading-7 text-stone-600">
            先发送验证码，再填写验证码和密码完成注册。注册成功后会直接进入书库。
          </p>
        </div>

        <form action={sendCodeFormAction} className="space-y-4">
          <Input
            autoComplete="email"
            name="email"
            placeholder="注册邮箱"
            required
            type="email"
          />
          {codeState.message ? <FormMessage tone="success">{codeState.message}</FormMessage> : null}
          {codeState.error ? <FormMessage tone="error">{codeState.error}</FormMessage> : null}
          <SubmitButton
            className="w-full"
            pendingText="发送中..."
            text="发送邮箱验证码"
            variant="secondary"
          />
        </form>

        <form action={registerFormAction} className="space-y-4">
          <input name="redirect_to" type="hidden" value={redirectTo ?? "/library"} />
          <Input
            autoComplete="email"
            name="email"
            placeholder="注册邮箱"
            required
            type="email"
          />
          <Input
            inputMode="numeric"
            maxLength={6}
            name="code"
            placeholder="6 位邮箱验证码"
            required
            type="text"
          />
          <Input
            autoComplete="new-password"
            name="password"
            placeholder="密码（至少 8 位）"
            required
            type="password"
          />
          <Input
            autoComplete="new-password"
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
          <SubmitButton className="w-full" pendingText="注册中..." text="完成注册并进入书库" />
        </form>
      </Panel>
    </div>
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
          ? "rounded-2xl bg-amber-200/15 px-4 py-3 text-sm text-amber-200 dark:text-amber-300"
          : "rounded-2xl bg-emerald-500/12 px-4 py-3 text-sm text-emerald-700"
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
}: {
  text: string;
  pendingText: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button className={className ?? "w-full"} disabled={pending} type="submit" variant={variant}>
      {pending ? pendingText : text}
    </Button>
  );
}
