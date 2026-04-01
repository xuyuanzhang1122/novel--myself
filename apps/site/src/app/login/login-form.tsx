"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button, Input } from "@xu-novel/ui";

import { signInAction } from "../auth-actions";

const initialState = {
  error: null,
};

export function LoginForm({
  defaultEmail,
  passwordHint,
  redirectTo,
}: {
  defaultEmail: string;
  passwordHint: string;
  redirectTo?: string;
}) {
  const [state, formAction] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <input name="redirect_to" type="hidden" value={redirectTo ?? "/library"} />
      <Input
        defaultValue={defaultEmail}
        name="email"
        placeholder={`邮箱（默认 ${defaultEmail}）`}
        required
        type="email"
      />
      <Input
        name="password"
        placeholder="密码"
        required
        type="password"
      />
      <p className="text-xs leading-6 text-stone-400">
        当前管理员账号：{defaultEmail}。{passwordHint === "使用你配置的管理员密码"
          ? passwordHint
          : `未设置环境变量时默认密码为 ${passwordHint}。`}
      </p>
      {state.error ? <p className="text-sm text-amber-300">{state.error}</p> : null}
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full bg-stone-100 text-stone-950 hover:bg-stone-200" disabled={pending} type="submit">
      {pending ? "进入中..." : "进入阅读室"}
    </Button>
  );
}
