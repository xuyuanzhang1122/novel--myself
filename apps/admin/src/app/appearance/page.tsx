import { redirect } from "next/navigation";

import { getAdminUser, getSiteSettings } from "@xu-novel/lib";
import { Button, Panel } from "@xu-novel/ui";

import { AdminShell } from "../admin-shell";
import { FormWithError } from "../form-with-error";
import { ImageUploadField } from "../image-upload-field";
import { saveAppearanceAction } from "./actions";

export default async function AppearancePage() {
  const user = await getAdminUser();
  if (!user) {
    redirect("/login?redirectedFrom=/appearance");
  }

  const settings = await getSiteSettings();

  return (
    <AdminShell
      title="外观"
      subtitle="品牌文案、Hero 结构和默认阅读风格，都应该边看预览边改，而不是盲填字段。"
    >
      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_400px]">
        <Panel className="min-w-0 space-y-5 border-stone-800 bg-stone-900/70">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">前台配置</p>
            <h3 className="font-serif text-3xl tracking-tight">更新品牌与首页氛围</h3>
          </div>

          <FormWithError action={saveAppearanceAction} className="grid gap-5">
            <div className="space-y-2">
              <p className="text-sm text-stone-400">品牌文案</p>
              <textarea
                className="min-h-24 rounded-3xl border border-stone-800 bg-stone-950 px-4 py-3"
                defaultValue={settings.brand_line ?? ""}
                name="brand_line"
                placeholder="品牌文案"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm text-stone-400">Hero 小标题</span>
                <input
                  className="rounded-2xl border border-stone-800 bg-stone-950 px-4 py-3"
                  defaultValue={settings.hero_eyebrow ?? ""}
                  name="hero_eyebrow"
                  placeholder="Hero 小标题"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-stone-400">Hero 主标题</span>
                <input
                  className="rounded-2xl border border-stone-800 bg-stone-950 px-4 py-3"
                  defaultValue={settings.hero_title ?? ""}
                  name="hero_title"
                  placeholder="Hero 主标题"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm text-stone-400">主按钮文案</span>
                <input
                  className="rounded-2xl border border-stone-800 bg-stone-950 px-4 py-3"
                  defaultValue={settings.hero_primary_action ?? ""}
                  name="hero_primary_action"
                  placeholder="主按钮文案"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-stone-400">次按钮文案</span>
                <input
                  className="rounded-2xl border border-stone-800 bg-stone-950 px-4 py-3"
                  defaultValue={settings.hero_secondary_action ?? ""}
                  name="hero_secondary_action"
                  placeholder="次按钮文案"
                />
              </label>
            </div>

            <ImageUploadField
              folder="appearance"
              helpText="首页 Hero 区域的背景图，会同步到前台站点。"
              initialValue={settings.homepage_background_url}
              label="首页背景图片"
              name="homepage_background_url"
            />

            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-2">
                <span className="text-sm text-stone-400">默认主题</span>
                <select
                  className="rounded-2xl border border-stone-800 bg-stone-950 px-4 py-3"
                  defaultValue={settings.default_theme}
                  name="default_theme"
                >
                  <option value="paper">纸张</option>
                  <option value="night">夜间</option>
                  <option value="mist">雾灰</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm text-stone-400">默认字体</span>
                <select
                  className="rounded-2xl border border-stone-800 bg-stone-950 px-4 py-3"
                  defaultValue={settings.default_font}
                  name="default_font"
                >
                  <option value="serif">衬线</option>
                  <option value="song">宋体</option>
                  <option value="sans">无衬线</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm text-stone-400">强调色</span>
                <input
                  className="rounded-2xl border border-stone-800 bg-stone-950 px-4 py-3"
                  defaultValue={settings.accent_hex ?? "#c08457"}
                  name="accent_hex"
                  placeholder="#c08457"
                />
              </label>
            </div>

            <div className="flex justify-end">
              <Button type="submit">保存外观</Button>
            </div>
          </FormWithError>
        </Panel>

        <div className="min-w-0 space-y-5">
          <Panel className="space-y-4 border-stone-800 bg-stone-900/70">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">前台预览</p>
            <div
              className="overflow-hidden rounded-[2rem] border border-stone-800 bg-stone-950"
              style={{
                backgroundImage: `linear-gradient(120deg,rgba(10,10,10,0.82),rgba(10,10,10,0.45)), url(${settings.homepage_background_url ?? ""})`,
                backgroundPosition: "center",
                backgroundSize: "cover",
              }}
            >
              <div className="space-y-5 px-5 py-6">
                <p className="text-[11px] uppercase tracking-[0.34em] text-stone-300">
                  {settings.hero_eyebrow ?? "阅读空间"}
                </p>
                <div className="space-y-3">
                  <p className="max-w-[10ch] font-serif text-4xl leading-[0.92] tracking-tight text-stone-50">
                    {settings.hero_title ?? "给长章节与未完稿准备的私家书架。"}
                  </p>
                  <p className="text-sm leading-7 text-stone-300">
                    {settings.brand_line ?? "站点背景、首页 Hero 和默认阅读风格正在由这里统一控制。"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <span className="rounded-full px-4 py-2 text-sm text-stone-950" style={{ backgroundColor: settings.accent_hex ?? "#c08457" }}>
                    {settings.hero_primary_action ?? "继续阅读"}
                  </span>
                  <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-stone-50">
                    {settings.hero_secondary_action ?? "阅读设置"}
                  </span>
                </div>
              </div>
            </div>
          </Panel>

          <Panel className="space-y-4 border-stone-800 bg-stone-900/70">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">当前默认值</p>
            <div className="space-y-3 text-sm leading-7 text-stone-300">
              <p>默认主题：{settings.default_theme}</p>
              <p>默认字体：{settings.default_font}</p>
              <p>强调色：{settings.accent_hex ?? "#c08457"}</p>
            </div>
          </Panel>
        </div>
      </div>
    </AdminShell>
  );
}
