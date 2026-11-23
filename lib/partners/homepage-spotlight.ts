import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const DR_BALDWIN_SLUG = "dr-gracyn-baldwin";

export type HomepagePartnerSpotlight = {
  slug: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  image_url: string;
  image_alt: string;
  image_path: string;
  primary_label: string;
  primary_href: string;
  secondary_label: string;
  secondary_href: string;
  is_published: boolean;
  updated_at: string;
};

export async function getHomepagePartnerSpotlight(includeDraft = false) {
  try {
    let query = supabaseAdmin.from("homepage_partner_spotlights")
      .select("slug,eyebrow,title,subtitle,description,image_url,image_alt,image_path,primary_label,primary_href,secondary_label,secondary_href,is_published,updated_at")
      .eq("slug", DR_BALDWIN_SLUG);
    if (!includeDraft) query = query.eq("is_published", true);
    const { data, error } = await query.maybeSingle();
    if (error) {
      console.error("[partner-spotlight] lookup failed", error.message);
      return null;
    }
    return data as HomepagePartnerSpotlight | null;
  } catch {
    return null;
  }
}

export function safeSpotlightHref(value: string) {
  const href = value.trim();
  if (href.startsWith("/") && !href.startsWith("//") && !href.includes("\\")) return href;
  try {
    const parsed = new URL(href);
    return parsed.protocol === "https:" ? parsed.href : "";
  } catch { return ""; }
}
