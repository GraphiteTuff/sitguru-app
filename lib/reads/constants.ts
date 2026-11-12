import { DESK_UI } from "@/lib/portal/desk-ui";
import type { ReadsContentType, ReadsDisclosureLabel } from "./types";

/** Public facing Reads palette (mockup): forest green hero + orange/purple accents. */
export const READS_BRAND = {
  green: "#0D5C3A",
  greenDeep: "#09462C",
  navy: "#163127",
  orange: "#E86A17",
  purple: "#6D28D9",
  cream: "#F4F7FB",
  white: "#FFFFFF",
  pageBg: "#F4F7FB",
} as const;

/** Staff Reads portals reuse Manager Desk tokens. */
export const READS_UI = {
  page: `${DESK_UI.pageBg} text-[#0F2744]`,
  card: DESK_UI.card,
  cardPad: `${DESK_UI.card} p-5`,
  eyebrow: "text-[11px] font-black uppercase tracking-[0.14em] text-slate-400",
  title: "font-black tracking-tight text-[#0F2744]",
  body: "font-semibold text-slate-600",
  link: DESK_UI.link,
  primaryBtn:
    "rounded-full bg-[#2563EB] px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-[#1D4ED8]",
  secondaryBtn:
    "rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-[#0F2744] transition hover:bg-[#EEF2F6]",
  chip: "rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-bold text-[#1D4ED8]",
  input:
    "w-full rounded-xl border-0 bg-[#EEF2F6] px-3 py-2.5 text-sm font-semibold text-[#0F2744] outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-[#2563EB]/25",
  headerBar: "border-b border-slate-200/80 bg-white/90 backdrop-blur",
  navIdle: "bg-[#EEF2F6] text-[#0F2744] hover:bg-[#DBEAFE]",
  navActive: DESK_UI.sidebarActive,
} as const;

export const READS_HERO_IMAGE = "/images/booking-hero-pets.png";

/** Podcasts browse / listen hero (studio retriever). */
export const READS_PODCAST_HERO_IMAGE =
  "/images/reads/podcast-hero-retriever.png";

export const READS_FORMAT_NAV: Array<{
  href: string;
  label: string;
  description: string;
  format: ReadsContentType | "team" | "guru" | "pet_parent";
}> = [
  {
    href: "/reads/books",
    label: "Books",
    description: "Trusted pet books curated for Pet Parents and Gurus.",
    format: "book",
  },
  {
    href: "/reads/magazines",
    label: "Magazines",
    description: "Pet publications and professional reads.",
    format: "magazine",
  },
  {
    href: "/reads/podcasts",
    label: "Podcasts",
    description: "Expert conversations and SitGuru episodes.",
    format: "podcast",
  },
  {
    href: "/reads/videos",
    label: "Videos",
    description: "Curated YouTube learning from SitGuru and guests.",
    format: "video",
  },
  {
    href: "/reads/authors",
    label: "Authors",
    description: "Authors, veterinarians, and pet experts.",
    format: "author",
  },
  {
    href: "/reads/team-picks",
    label: "Team Picks",
    description: "Recommendations from the SitGuru team.",
    format: "team",
  },
  {
    href: "/reads/guru-picks",
    label: "Guru Picks",
    description: "Coming soon — Guru community recommendations.",
    format: "guru",
  },
  {
    href: "/reads/pet-parent-picks",
    label: "Pet Parent Picks",
    description: "Coming soon — Pet Parent recommendations.",
    format: "pet_parent",
  },
];

export const READS_MOBILE_NAV = [
  { href: "/reads/books", label: "Books" },
  { href: "/reads/magazines", label: "Magazines" },
  { href: "/reads/podcasts", label: "Podcasts" },
  { href: "/reads/authors", label: "Authors" },
  { href: "/reads/team-picks", label: "Team Picks" },
] as const;

export const READS_DISCLOSURE_COPY: Record<ReadsDisclosureLabel, string> = {
  sitguru_recommended: "SitGuru Recommended",
  partner_feature: "Partner Feature",
  sponsored: "Sponsored",
  none: "",
};

export const READS_HEADLINE =
  "Books, magazines, podcasts and voices for happier pets, smarter Pet Parents, and stronger Gurus.";

export const READS_SUPPORTING =
  "Discover trusted books, pet publications, expert conversations, and community recommendations curated by the SitGuru team, Gurus, Pet Parents, authors, and pet experts.";

export const READS_DESCRIPTOR = "Books • Magazines • Podcasts • Authors";

export const READS_PRIMARY_CTAS = [
  { href: "/reads/books", label: "Explore Books" },
  { href: "/reads/magazines", label: "Browse Magazines" },
  { href: "/reads/podcasts", label: "Listen to Podcasts" },
  { href: "/reads/authors", label: "Meet Our Authors" },
] as const;

export const MANAGER_READS_BASE = "/manager/reads";
export const INTERN_READS_BASE = "/intern/content/reads";
export const ADMIN_READS_BASE = "/admin/growth/reads";

export const READS_MANAGER_ROLES = new Set([
  "growth_manager",
  "marketing_manager",
  "marketing_admin",
  "sales_admin",
  "founder",
  "owner",
  "super_admin",
  "super_user",
  "admin",
]);

export const READS_INTERN_ROLES = new Set(["content_intern", "intern"]);

export const READS_ADMIN_OVERRIDE_ROLES = new Set([
  "founder",
  "owner",
  "super_admin",
  "super_user",
]);

/** Interns may draft/submit; they cannot publish or self-approve. */
export const INTERN_ALLOWED_STATUSES = new Set([
  "draft",
  "submitted",
  "changes_requested",
]);

export const MANAGER_PUBLISH_STATUSES = new Set([
  "draft",
  "submitted",
  "changes_requested",
  "approved",
  "scheduled",
  "published",
  "archived",
]);
