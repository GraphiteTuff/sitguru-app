"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { getAdminIdentity } from "@/lib/admin/access";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { DR_BALDWIN_SLUG, safeSpotlightHref } from "./homepage-spotlight";

export type SpotlightSaveState = { ok: boolean; message: string; error: string };
const denied = { ok: false, message: "", error: "Only Super Admin and the assigned Community Growth Manager may edit homepage spotlights." };

export async function saveHomepagePartnerSpotlight(_previous: SpotlightSaveState, form: FormData): Promise<SpotlightSaveState> {
  const actor = await getAdminIdentity();
  if (!actor || !(actor.isSuperUser || actor.role === "social_community_manager")) return denied;
  const text = (key: string, limit: number) => String(form.get(key) || "").trim().slice(0, limit);
  const payload = {
    eyebrow: text("eyebrow", 70),
    title: text("title", 140),
    subtitle: text("subtitle", 140),
    description: text("description", 3500),
    article_body: text("article_body", 10000),
    image_alt: text("image_alt", 220),
    primary_label: text("primary_label", 80),
    primary_href: safeSpotlightHref(text("primary_href", 1000)),
    secondary_label: text("secondary_label", 80),
    secondary_href: safeSpotlightHref(text("secondary_href", 1000)),
    is_published: form.get("is_published") === "on",
    updated_by: actor.id,
    updated_at: new Date().toISOString(),
  };
  if (!payload.title || !payload.description || !payload.primary_href || !payload.secondary_href) {
    return { ok: false, message: "", error: "Add the title, description, and valid HTTPS or internal button links." };
  }
  const file = form.get("image");
  let imagePath: string | undefined;
  if (file instanceof File && file.size > 0) {
    if (file.size > 6 * 1024 * 1024) return { ok: false, message: "", error: "Image must be 6 MB or smaller." };
    const bytes = new Uint8Array(await file.arrayBuffer());
    const jpeg = file.type === "image/jpeg" && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    const png = file.type === "image/png" && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
    const webp = file.type === "image/webp" && String.fromCharCode(...bytes.slice(0,4)) === "RIFF" && String.fromCharCode(...bytes.slice(8,12)) === "WEBP";
    if (!jpeg && !png && !webp) return { ok: false, message: "", error: "Upload a genuine JPG, PNG, or WebP image." };
    const ext = jpeg ? "jpg" : png ? "png" : "webp";
    imagePath = `partner-spotlights/${DR_BALDWIN_SLUG}/${randomUUID()}.${ext}`;
    const { error } = await supabaseAdmin.storage.from("sitguru-community-private")
      .upload(imagePath, bytes, { contentType: file.type, upsert: false });
    if (error) return { ok: false, message: "", error: "The photo could not be uploaded. Please try again." };
  }
  const update: Record<string, unknown> = { ...payload };
  if (imagePath) {
    update.image_path = imagePath;
    update.image_url = `/api/partners/spotlight/photo?slug=${DR_BALDWIN_SLUG}`;
  }
  const { error } = await supabaseAdmin.from("homepage_partner_spotlights")
    .update(update).eq("slug", DR_BALDWIN_SLUG);
  if (error) return { ok: false, message: "", error: "The spotlight could not be saved." };
  revalidatePath("/");
  revalidatePath("/manager/community-studio");
  revalidatePath("/partners/spotlight/dr-gracyn-baldwin");
  return { ok: true, message: payload.is_published ? "Published. Homepage updates on reload (and auto-refresh)." : "Saved as a private draft.", error: "" };
}
