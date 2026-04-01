import { redirect } from "next/navigation";

import {
  defaultReaderPreference,
  getReaderPreference,
  getUser,
} from "@xu-novel/lib";
import { Button, Panel, SectionHeading } from "@xu-novel/ui";

import { SiteShell } from "../site-shell";
import { saveReaderPreferenceAction } from "./actions";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await getUser();
  if (!user) {
    redirect("/login?redirectedFrom=/settings");
  }

  const [params, preference] = await Promise.all([
    searchParams,
    getReaderPreference(user.id),
  ]);
  const currentPreference = preference ?? {
    id: `default-${user.id}`,
    user_id: user.id,
    ...defaultReaderPreference,
  };

  return (
    <SiteShell heading="设置" subheading="阅读偏好与站点会话将在这里集中管理。">
      <Panel className="space-y-6 paper-noise">
        <SectionHeading
          eyebrow="阅读器"
          title="偏好设置"
          description="这里保存的是你的真实阅读偏好。修改后进入章节页会立即按新的字号、字体、宽度与主题渲染。"
        />
        <div className="rounded-[1.75rem] border border-stone-300/70 px-5 py-4 text-sm text-stone-600">
          当前登录账号：{user.email}
        </div>
        {params.saved === "1" ? (
          <div className="rounded-[1.75rem] border border-emerald-300/70 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
            偏好已保存。下次进入阅读页会自动应用。
          </div>
        ) : null}
        <form action={saveReaderPreferenceAction} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-stone-600">默认字体</span>
              <select
                className="w-full rounded-[1.5rem] border border-stone-300/70 bg-white/80 px-4 py-3"
                defaultValue={currentPreference.font_family}
                name="font_family"
              >
                <option value="serif">衬线</option>
                <option value="song">宋体</option>
                <option value="sans">无衬线</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm text-stone-600">默认主题</span>
              <select
                className="w-full rounded-[1.5rem] border border-stone-300/70 bg-white/80 px-4 py-3"
                defaultValue={currentPreference.theme}
                name="theme"
              >
                <option value="paper">纸张</option>
                <option value="night">夜间</option>
                <option value="mist">雾灰</option>
              </select>
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-stone-600">页面宽度</span>
              <select
                className="w-full rounded-[1.5rem] border border-stone-300/70 bg-white/80 px-4 py-3"
                defaultValue={currentPreference.page_width}
                name="page_width"
              >
                <option value="narrow">窄版</option>
                <option value="standard">标准</option>
                <option value="wide">宽版</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm text-stone-600">默认字号倍率</span>
              <input
                className="w-full"
                defaultValue={currentPreference.font_scale}
                max="1.6"
                min="0.9"
                name="font_scale"
                step="0.05"
                type="range"
              />
              <p className="text-xs text-stone-500">
                当前值：{currentPreference.font_scale.toFixed(2)} 倍
              </p>
            </label>
          </div>
          <div className="flex justify-end">
            <Button type="submit">保存偏好</Button>
          </div>
        </form>
      </Panel>
    </SiteShell>
  );
}
