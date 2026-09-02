export const GROWTH_CHANNELS = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "facebook_group", label: "Facebook Group" },
  { value: "stories", label: "Stories" },
  { value: "other", label: "Other" },
] as const;

export const GROWTH_CREATE_KINDS = [
  {
    value: "guru",
    label: "Guru Spotlight",
    detail: "Promote a public Guru and send people to their profile.",
    destination: "/signup?role=pet_parent",
  },
  {
    value: "event",
    label: "Event",
    detail: "Share a local pet event and invite Pet Parents.",
    destination: "/community",
  },
  {
    value: "partner",
    label: "Partner",
    detail: "Spotlight an approved local pet business.",
    destination: "/partners",
  },
  {
    value: "pawperks",
    label: "PawPerks",
    detail: "Invite people to join and refer friends.",
    destination: "/signup?role=pet_parent",
  },
  {
    value: "pet_parent",
    label: "Pet Parent",
    detail: "Straight signup CTA for Pet Parents.",
    destination: "/signup?role=pet_parent",
  },
  {
    value: "feature",
    label: "SitGuru Feature",
    detail: "Explain one SitGuru benefit, then convert.",
    destination: "/",
  },
  {
    value: "post",
    label: "General Post",
    detail: "Community, founder, or education post with a tracking link.",
    destination: "/signup?role=pet_parent",
  },
] as const;

export const GROWTH_CONTENT_STATUSES = [
  "Draft",
  "Needs CEO Review",
  "Ready",
  "Posted",
] as const;

export const GROWTH_CAMPAIGN_STATUSES = [
  "active",
  "paused",
  "draft",
  "completed",
] as const;

export function getPublicSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://sitguru.com"
  ).replace(/\/$/, "");
}

export function campaignTrackingPath(slug: string) {
  return `/go/${encodeURIComponent(slug)}`;
}

export function campaignTrackingUrl(slug: string) {
  return `${getPublicSiteUrl()}${campaignTrackingPath(slug)}`;
}

export function channelLabel(value: string) {
  return (
    GROWTH_CHANNELS.find((item) => item.value === value)?.label ||
    value.replaceAll("_", " ")
  );
}

export function kindMeta(value: string) {
  return (
    GROWTH_CREATE_KINDS.find((item) => item.value === value) ||
    GROWTH_CREATE_KINDS[GROWTH_CREATE_KINDS.length - 1]
  );
}

export function slugifyCampaign(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return slug || `sg-${Date.now().toString(36)}`;
}
