"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button, Input, Panel } from "@xu-novel/ui";

import {
  changePasswordAction,
  deleteAccountAction,
  type AccountActionState,
} from "./actions";

const initialState: AccountActionState = {
  error: null,
  message: null,
};

export function AccountSecurity({ email }: { email: string }) {
  const [passwordState, passwordFormAction] = useActionState(
    changePasswordAction,
    initialState,
  );
  const [deleteState, deleteFormAction] = useActionState(
    deleteAccountAction,
    initialState,
  );

  return (
    <div className="space-y-6">
      <Panel className="space-y-5 border-stone-200/70 bg-white/80">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.28em] text-stone-500">账号安全</p>
          <h3 className="font-serif text-3xl tracking-tight text-stone-900">修改密码</h3>
          <p className="text-sm leading-7 text-stone-600">
            当前账号是 {email}。修改后，新密码会立即生效。
          </p>
        </div>

        <form action={passwordFormAction} className="space-y-3.5">
          <Input name="current_password" placeholder="当前密码" required type="password" />
          <Input name="next_password" placeholder="新密码（至少 8 位）" required type="password" />
          <Input
            name="confirm_password"
            placeholder="确认新密码"
            required
            type="password"
          />
          {passwordState.message ? (
            <Message tone="success">{passwordState.message}</Message>
          ) : null}
          {passwordState.error ? (
            <Message tone="error">{passwordState.error}</Message>
          ) : null}
          <div className="flex justify-end">
            <SubmitButton pendingText="更新中..." text="更新密码" />
          </div>
        </form>
      </Panel>

      <Panel className="space-y-5 border-red-200/70 bg-red-50/80">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.28em] text-red-500">危险操作</p>
          <h3 className="font-serif text-3xl tracking-tight text-red-700">删除账号</h3>
          <p className="text-sm leading-7 text-red-700/80">
            删除后会清空你的阅读进度与阅读偏好。请输入当前邮箱和密码确认。
          </p>
        </div>

        <form action={deleteFormAction} className="space-y-3.5">
          <Input name="confirmation" placeholder={`输入 ${email} 以确认`} required type="text" />
          <Input name="password" placeholder="当前密码" required type="password" />
          {deleteState.error ? <Message tone="error">{deleteState.error}</Message> : null}
          <div className="flex justify-end">
            <SubmitButton
              className="bg-red-600 text-white hover:bg-red-500 dark:bg-red-600 dark:text-white dark:hover:bg-red-500"
              pendingText="删除中..."
              text="删除我的账号"
            />
          </div>
        </form>
      </Panel>
    </div>
  );
}

function Message({
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
          ? "rounded-[1.2rem] border border-red-200 bg-red-100/80 px-4 py-3 text-sm text-red-700"
          : "rounded-[1.2rem] border border-emerald-200 bg-emerald-100/80 px-4 py-3 text-sm text-emerald-700"
      }
    >
      {children}
    </p>
  );
}

function SubmitButton({
  text,
  pendingText,
  className,
}: {
  text: string;
  pendingText: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button className={className} type="submit">
      {pending ? pendingText : text}
    </Button>
  );
}
