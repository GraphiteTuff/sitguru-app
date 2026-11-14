/**
 * Role-aware navigation into ONE approved SitGuru brand-asset library.
 * The backing data is growth_brand_assets for every staff role.
 * Never route interns to Manager/Admin pages or grant edit/approval via links.
 */
export type TeamToolkitRole = "manager" | "intern" | "admin";

export const APPROVED_TEAM_ASSET_CATEGORIES = [
  { id: "official_logos", title: "Official logos", detail: "Approved SitGuru marks" },
  { id: "social_graphics", title: "Social graphics", detail: "Graphics ready for community posts" },
  { id: "templates", title: "Templates", detail: "Reusable campaign layouts" },
  { id: "guidelines", title: "Brand guidelines", detail: "Approved colors, type and usage rules" },
  { id: "flyers", title: "Marketing flyers", detail: "Community and event materials" },
  { id: "videos", title: "Videos", detail: "Approved video resources" },
] as const;

export function teamBrandHref(role: TeamToolkitRole, category?: string) {
  const base = role === "intern" ? "/intern/toolkit?tool=brand" : role === "admin" ? "/admin/toolkit/brand" : "/manager/toolkit/brand";
  const suffix = category ? `category=${encodeURIComponent(category)}` : "";
  if (!suffix) return base;
  return `${base}${base.includes("?") ? "&" : "?"}${suffix}`;
}

export function teamToolkitHref(role: TeamToolkitRole) {
  return role === "intern" ? "/intern/toolkit" : role === "admin" ? "/admin/toolkit" : "/manager/toolkit";
}

export function teamResourcesHref(role: TeamToolkitRole) {
  return role === "intern" ? "/intern/resources" : role === "admin" ? "/admin/resources" : "/manager/resources";
}
