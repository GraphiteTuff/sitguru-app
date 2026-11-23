import type { SocialConnectorStatus } from "@/lib/growth-center-v2/types";

export const SOCIAL_CHANNELS = ["facebook", "instagram", "tiktok", "x", "youtube"] as const;
export type SocialChannel = (typeof SOCIAL_CHANNELS)[number];
export const SOCIAL_LABELS: Record<SocialChannel, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  x: "X",
  youtube: "YouTube",
};
export type ImpactCounts = {
  pageViews: number;
  linkClicks: number;
  signupEvents: number;
  bookingEvents: number;
  paidBookings: number | null;
  netRevenueCents: number | null;
};
export type PostMetrics = {
  views: number | null;
  reach: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  follows: number | null;
  hookRate: number | null;
  averageWatchSeconds: number | null;
  capturedAt: string | null;
  source: string | null;
};
export type SocialPost = {
  id: string;
  channel: SocialChannel;
  title: string;
  publishedUrl: string;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  campaignSlug: string;
  trackingKey: string;
  studioContentId: string | null;
  metrics: PostMetrics;
  impact: ImpactCounts;
  daily: Array<{ date: string; views: number | null }>;
};
export type SocialIntelligenceSnapshot = {
  capturedAt: string;
  rangeLabel: string;
  preset: string;
  platform: string;
  audience: string;
  campaign: string;
  total: ImpactCounts;
  prior: ImpactCounts;
  postViews: number | null;
  postEngagements: number | null;
  postMetricsAt: string | null;
  sourceCoverage: {
    eventsLoaded: number;
    truncated: boolean;
    matchedPostEvents: number;
    bookingAttributionComplete: boolean;
  };
  daily: Array<{ date: string; pageViews: number; linkClicks: number; signupEvents: number; bookingEvents: number }>;
  channels: Array<{ channel: SocialChannel; impact: ImpactCounts; followers: number | null; status: SocialConnectorStatus["status"]; lastSyncedAt: string | null }>;
  campaigns: Array<{ slug: string; label: string; channel: string; impact: ImpactCounts }>;
  posts: SocialPost[];
  connections: SocialConnectorStatus[];
  notices: string[];
};
