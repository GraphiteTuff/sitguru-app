/**
 * Official SitGuru social destinations — handle is SitGuruOfficial everywhere.
 */

export const SITGURU_OFFICIAL_HANDLE = "@SitGuruOfficial";

export type SitGuruSocialPlatform = {
  id: "instagram" | "facebook" | "tiktok" | "x" | "youtube";
  label: string;
  href: string;
};

export const SITGURU_OFFICIAL_SOCIAL_LINKS: readonly SitGuruSocialPlatform[] = [
  {
    id: "facebook",
    label: "Facebook",
    href: "https://www.facebook.com/SitGuruOfficial",
  },
  {
    id: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/SitGuruOfficial",
  },
  {
    id: "tiktok",
    label: "TikTok",
    href: "https://www.tiktok.com/@SitGuruOfficial",
  },
  {
    id: "x",
    label: "X",
    href: "https://x.com/SitGuruOfficial",
  },
  {
    id: "youtube",
    label: "YouTube",
    href: "https://www.youtube.com/@SitGuruOfficial",
  },
] as const;
