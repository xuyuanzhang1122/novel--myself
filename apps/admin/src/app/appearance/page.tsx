import { redirect } from "next/navigation";

import { getSiteSettings, getUser } from "@xu-novel/lib";
import { Button, Panel } from "@xu-novel/ui";

import { AdminShell } from "../admin-shell";
import { FormWithError } from "../form-with-error";
import { ImageUploadField } from "../image-upload-field";
import { saveAppearanceAction } from "./actions";

export default async function AppearancePage() {
  const user = await getUser();
  if (!user) {
    redirect("/login?redirectedFrom=/appearance");
  }

  const settings = await getSiteSettings();

  return (
    <AdminShell
      title="外观"
      subtitle="站点背景、首页 Hero、默认字体与品牌文案通过数据库统一控制。"
    >
      <Panel className="space-y-5 border-stone-800 bg-stone-900/70">
        <FormWithError action={saveAppearanceAction} className="grid gap-4">
          <textarea
            className="min-h-24 rounded-3xl bg-stone-950 px-4 py-3"
            name="brand_line"
            defaultValue={settings.brand_line ?? ""}
            placeholder="品牌文案"
          />
          <div className="grid gap-4 md:grid-cols-2">
            <input
              className="rounded-2xl bg-stone-950 px-4 py-3"
              name="hero_eyebrow"
              defaultValue={settings.hero_eyebrow ?? ""}
              placeholder="Hero 小标题"
            />
            <input
              className="rounded-2xl bg-stone-950 px-4 py-3"
              name="hero_title"
              defaultValue={settings.hero_title ?? ""}
              placeholder="Hero 主标题"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              className="rounded-2xl bg-stone-950 px-4 py-3"
              name="hero_primary_action"
              defaultValue={settings.hero_primary_action ?? ""}
              placeholder="主按钮文案"
            />
            <input
              className="rounded-2xl bg-stone-950 px-4 py-3"
              name="hero_secondary_action"
              defaultValue={settings.hero_secondary_action ?? ""}
              placeholder="次按钮文案"
            />
          </div>
          <ImageUploadField
            folder="appearance"
            helpText="首页 Hero 区域的背景图。会同步到前台站点。"
            initialValue={settings.homepage_background_url}
            label="首页背景图片"
            name="homepage_background_url"
          />
          <div className="grid gap-4 md:grid-cols-3">
            <select
              className="rounded-2xl bg-stone-950 px-4 py-3"
              name="default_theme"
              defaultValue={settings.default_theme}
            >
              <option value="paper">纸张</option>
              <option value="night">夜间</option>
              <option value="mist">雾灰</option>
            </select>
            <select
              className="rounded-2xl bg-stone-950 px-4 py-3"
              name="default_font"
              defaultValue={settings.default_font}
            >
              <option value="serif">衬线</option>
              <option value="song">宋体</option>
              <option value="sans">无衬线</option>
            </select>
            <input
              className="rounded-2xl bg-stone-950 px-4 py-3"
              name="accent_hex"
              defaultValue={settings.accent_hex ?? "#c08457"}
              placeholder="#c08457"
            />
          </div>
          <Button type="submit">保存外观</Button>
        </FormWithError>
      </Panel>
    </AdminShell>
  );
}
