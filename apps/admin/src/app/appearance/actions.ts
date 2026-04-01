"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";

import {
  getUser,
  prisma,
  siteSettingsTag,
  triggerSiteRevalidation,
} from "@xu-novel/lib";

import { parseAppearanceInput } from "../../lib/validation";

export async function saveAppearanceAction(formData: FormData) {
  const user = await getUser();
  if (!user) {
    redirect("/login?redirectedFrom=/appearance");
  }

  const input = parseAppearanceInput(formData);

  try {
    await prisma.siteSettings.upsert({
      where: { id: "default" },
      update: {
        homepageBackgroundUrl: input.homepage_background_url,
        brandLine: input.brand_line,
        heroEyebrow: input.hero_eyebrow,
        heroTitle: input.hero_title,
        heroPrimaryAction: input.hero_primary_action,
        heroSecondaryAction: input.hero_secondary_action,
        defaultTheme: input.default_theme,
        defaultFont: input.default_font,
        accentHex: input.accent_hex,
      },
      create: {
        id: "default",
        homepageBackgroundUrl: input.homepage_background_url,
        brandLine: input.brand_line,
        heroEyebrow: input.hero_eyebrow,
        heroTitle: input.hero_title,
        heroPrimaryAction: input.hero_primary_action,
        heroSecondaryAction: input.hero_secondary_action,
        defaultTheme: input.default_theme || "paper",
        defaultFont: input.default_font || "serif",
        accentHex: input.accent_hex,
      }
    });

    await triggerSiteRevalidation([siteSettingsTag()]);
    revalidateTag(siteSettingsTag());
    revalidatePath("/appearance");
  } catch (error: any) {
    throw new Error(`保存失败：${error.message}`);
  }
}
