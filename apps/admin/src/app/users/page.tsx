import { redirect } from "next/navigation";

import { getAdminUser, listUsers } from "@xu-novel/lib";
import { Button, Input, Panel } from "@xu-novel/ui";

import { AdminShell } from "../admin-shell";
import { FormWithError } from "../form-with-error";
import { createUserAction, deleteUserAction, updateUserRoleAction } from "./actions";

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
      subtitle="新增用户、删除用户、切换管理员权限都集中在这里。普通用户不会被放行进入后台。"
    >
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel className="space-y-5 border-stone-800 bg-stone-900/70">
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
        </Panel>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["总用户数", String(users.length)],
              ["管理员", String(users.filter((item) => item.role === "ADMIN").length)],
              ["已验证邮箱", String(users.filter((item) => item.email_verified_at).length)],
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
              <h3 className="font-serif text-3xl tracking-tight">权限与账号列表</h3>
            </div>

            <div className="space-y-4">
              {users.map((item) => (
                <div
                  className="rounded-[1.8rem] border border-stone-800 bg-stone-950/75 p-5"
                  key={item.id}
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-2">
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

                    <div className="grid gap-3 md:grid-cols-[minmax(0,220px)_auto]">
                      <FormWithError action={updateUserRoleAction} className="flex flex-col gap-3 md:flex-row">
                        <input name="user_id" type="hidden" value={item.id} />
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
                      </FormWithError>

                      <FormWithError action={deleteUserAction}>
                        <input name="user_id" type="hidden" value={item.id} />
                        <Button type="submit" variant="ghost">
                          删除用户
                        </Button>
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
