import { redirect } from "next/navigation";

import { getAdminUser, listUsers } from "@xu-novel/lib";
import { Button, Input, Panel } from "@xu-novel/ui";

import { AdminShell } from "../admin-shell";
import { FormWithError } from "../form-with-error";
import {
  createUserAction,
  deleteUserAction,
  updateUserPasswordAction,
  updateUserRoleAction,
} from "./actions";

const timeFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function UsersPage() {
  const user = await getAdminUser();
  if (!user) {
    redirect("/login?redirectedFrom=/users");
  }

  const users = await listUsers();

  return (
    <AdminShell
      title="用户管理"
      subtitle="创建账号、调整权限、重置密码和删除用户都放在同一个操作台里，避免来回跳页面。"
    >
      <div className="grid gap-5 2xl:grid-cols-[380px_minmax(0,1fr)]">
        <Panel className="space-y-5 border-stone-800 bg-stone-900/70 2xl:sticky 2xl:top-4 2xl:self-start">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">新增用户</p>
            <h3 className="font-serif text-3xl tracking-tight">创建账号</h3>
            <p className="text-sm leading-7 text-stone-400">
              管理员可以直接创建用户账号，并指定是否拥有后台权限。
            </p>
          </div>

          <FormWithError action={createUserAction} className="space-y-4">
            <label className="space-y-2">
              <span className="text-sm text-stone-300">邮箱</span>
              <Input name="email" placeholder="user@example.com" required type="email" />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-stone-300">初始密码</span>
              <Input name="password" placeholder="至少 8 位" required type="password" />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-stone-300">角色权限</span>
              <select
                className="w-full rounded-2xl border border-stone-700 bg-stone-950/60 px-4 py-3 text-sm text-stone-100 outline-none"
                defaultValue="USER"
                name="role"
              >
                <option value="USER">普通用户</option>
                <option value="ADMIN">管理员</option>
              </select>
            </label>
            <Button type="submit">新增用户</Button>
          </FormWithError>

          <div className="space-y-3 rounded-[1.6rem] border border-stone-800/80 bg-stone-950/70 px-4 py-4 text-sm leading-7 text-stone-300">
            <p className="text-xs uppercase tracking-[0.24em] text-stone-500">这页现在支持</p>
            <p>创建用户</p>
            <p>切换权限</p>
            <p>重置密码</p>
            <p>删除账号</p>
          </div>
        </Panel>

        <div className="min-w-0 space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              ["总用户数", String(users.length)],
              ["管理员", String(users.filter((item) => item.role === "ADMIN").length)],
              ["已验证邮箱", String(users.filter((item) => item.email_verified_at).length)],
              ["普通用户", String(users.filter((item) => item.role !== "ADMIN").length)],
            ].map(([label, value]) => (
              <Panel className="space-y-3 border-stone-800 bg-stone-900/70" key={label}>
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">{label}</p>
                <p className="font-serif text-3xl tracking-tight">{value}</p>
              </Panel>
            ))}
          </div>

          <Panel className="space-y-4 border-stone-800 bg-stone-900/70">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.28em] text-stone-500">现有用户</p>
              <h3 className="font-serif text-3xl tracking-tight">权限、密码与删除</h3>
            </div>

            <div className="space-y-4">
              {users.map((item) => (
                <div
                  className="rounded-[1.8rem] border border-stone-800 bg-stone-950/75 p-5 transition hover:border-stone-700 hover:bg-stone-950"
                  key={item.id}
                >
                  <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-serif text-2xl tracking-tight">{item.email}</h4>
                        <span className="rounded-full border border-stone-700 px-3 py-1 text-xs uppercase tracking-[0.2em] text-stone-400">
                          {item.role === "ADMIN" ? "管理员" : "普通用户"}
                        </span>
                        <span className="rounded-full border border-stone-700 px-3 py-1 text-xs uppercase tracking-[0.2em] text-stone-500">
                          {item.email_verified_at ? "邮箱已验证" : "邮箱未验证"}
                        </span>
                        {item.id === user.id ? (
                          <span className="rounded-full border border-amber-700/70 px-3 py-1 text-xs uppercase tracking-[0.2em] text-amber-300">
                            当前登录
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm leading-7 text-stone-400">
                        创建于 {item.created_at ? timeFormatter.format(new Date(item.created_at)) : "-"}
                      </p>
                    </div>

                    <div className="min-w-0 space-y-3">
                      <FormWithError
                        action={updateUserRoleAction}
                        className="space-y-3 rounded-[1.4rem] border border-stone-800/80 bg-stone-900/60 p-4"
                      >
                        <input name="user_id" type="hidden" value={item.id} />
                        <div className="space-y-1">
                          <p className="text-xs uppercase tracking-[0.24em] text-stone-500">角色权限</p>
                          <div className="flex flex-col gap-3 md:flex-row">
                            <select
                              className="min-w-[180px] rounded-2xl border border-stone-700 bg-stone-950/60 px-4 py-3 text-sm text-stone-100 outline-none"
                              defaultValue={item.role}
                              name="role"
                            >
                              <option value="USER">普通用户</option>
                              <option value="ADMIN">管理员</option>
                            </select>
                            <Button type="submit" variant="secondary">
                              保存权限
                            </Button>
                          </div>
                        </div>
                      </FormWithError>

                      <FormWithError
                        action={updateUserPasswordAction}
                        className="space-y-3 rounded-[1.4rem] border border-stone-800/80 bg-stone-900/60 p-4"
                      >
                        <input name="user_id" type="hidden" value={item.id} />
                        <p className="text-xs uppercase tracking-[0.24em] text-stone-500">重置密码</p>
                        <div className="flex flex-col gap-3">
                          <Input
                            className="border-stone-700 bg-stone-950/60 text-stone-100"
                            name="password"
                            placeholder="输入新的临时密码"
                            required
                            type="password"
                          />
                          <div className="flex justify-end">
                            <Button type="submit" variant="secondary">
                              更新密码
                            </Button>
                          </div>
                        </div>
                      </FormWithError>

                      <FormWithError
                        action={deleteUserAction}
                        className="space-y-3 rounded-[1.4rem] border border-red-900/60 bg-red-950/15 p-4"
                      >
                        <input name="user_id" type="hidden" value={item.id} />
                        <p className="text-xs uppercase tracking-[0.24em] text-red-400">删除账号</p>
                        <p className="text-sm leading-6 text-red-100/80">
                          删除后会移除该用户的阅读偏好和阅读进度。
                        </p>
                        <div className="flex justify-end">
                          <Button
                            className="bg-red-600 text-white hover:bg-red-500 dark:bg-red-600 dark:text-white dark:hover:bg-red-500"
                            type="submit"
                          >
                            删除用户
                          </Button>
                        </div>
                      </FormWithError>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </AdminShell>
  );
}
