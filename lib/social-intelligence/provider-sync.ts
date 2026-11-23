/**
 * Import verified, owner-authorized social posts. Server only.
 *
 * Only the pinned official SitGuru Meta assets and approved production TikTok
 * account are queried. Never expose tokens to the browser, logs or URLs.
 * Metrics are provider snapshots, not proof of a SitGuru conversion.
 */
import { supabaseAdmin } from "@/lib/supabase/admin";
import { fetchOfficialMetaSnapshot } from "@/lib/meta/social-analytics";
import { verifiedSitGuruFacebookPageToken } from "@/lib/meta/facebook-page-access";
import { fetchAuthorizedTikTokVideoList } from "@/lib/tiktok/social-analytics";
import type { SocialChannel } from "./types";

type Row = Record<string, unknown>;
type ImportedPost = {
  id: string;
  platform: SocialChannel;
  publishedUrl: string;
  title: string;
  publishedAt: string;
  thumbnail: string | null;
  views: number | null;
  reach: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  follows: number | null;
};
export type ProviderSyncResult = {
  platform: SocialChannel;
  status: "imported" | "unavailable";
  posts: number;
  metricSnapshots: number;
  note: string;
};
function string(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
function number(value: unknown): number | null {
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) return value;
  return null;
}
function summaryCount(value: unknown): number | null {
  if (!value || typeof value !== "object") return null;
  return number((value as Row).total_count);
}
function permalinkKey(raw: string) {
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:") return "";
    const name = parsed.hostname.toLowerCase().replace(/^www\./, "");
    if (!["instagram.com", "facebook.com", "tiktok.com", "youtube.com", "x.com"].includes(name)) return "";
    return name + parsed.pathname.replace(/\/$/, "").toLowerCase();
  } catch {
    return "";
  }
}
function validProviderDate(value: unknown) {
  const result = Date.parse(string(value));
  return Number.isFinite(result) ? new Date(result).toISOString() : null;
}
function graphUrl(
  host: "graph.facebook.com" | "graph.instagram.com",
  path: string,
  fields: string,
  after?: string,
) {
  const url = new URL("https://" + host + "/v27.0/" + path);
  url.searchParams.set("fields", fields);
  url.searchParams.set("limit", "25");
  if (after) url.searchParams.set("after", after);
  return url;
}
/** Structured errors preserve safe numeric Meta codes, never raw API text. */
class MetaGraphRequestError extends Error {
  constructor(readonly status: number, readonly apiCode: number | null) {
    super("Meta Graph API request failed.");
    this.name = "MetaGraphRequestError";
  }
}
async function graphGet(url: URL, token: string) {
  const response = await fetch(url.toString(), {
    headers: { Authorization: "Bearer " + token },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  const payload: unknown = await response.json().catch(() => null);
  const data = payload && typeof payload === "object" && !Array.isArray(payload) ? payload as Row : null;
  if (!response.ok || !data || data.error) {
    const apiError = data?.error && typeof data.error === "object" ? data.error as Row : null;
    const apiCode = typeof apiError?.code === "number" && Number.isSafeInteger(apiError.code)
      ? apiError.code : null;
    throw new MetaGraphRequestError(response.status, apiCode);
  }
  return data;
}
async function graphList(
  host: "graph.facebook.com" | "graph.instagram.com",
  path: string,
  fields: string,
  token: string,
) {
  const result: Row[] = [];
  let after = "";
  for (let page = 0; page < 2; page++) {
    let response: Row;
    try {
      response = await graphGet(graphUrl(host, path, fields, after), token);
    } catch (error) {
      // Retry with basic fields only for unsupported Graph fields, not when
      // a credential is expired, Page permission is missing, or rate limited.
      if (error instanceof MetaGraphRequestError && error.apiCode !== 100 &&
        error.apiCode !== 3001) throw error;
      const fallback = host === "graph.facebook.com" &&
        (path.endsWith("/posts") || path.endsWith("/published_posts"))
        ? "id,message,permalink_url,created_time"
        : "id,permalink,media_type,timestamp";
      if (fields === fallback) throw error;
      response = await graphGet(graphUrl(host, path, fallback, after), token);
    }
    if (!Array.isArray(response.data)) throw new Error("Meta media list response did not contain media.");
    result.push(...(response.data as Row[]));
    const paging = response.paging && typeof response.paging === "object"
      ? response.paging as Row : {};
    const cursors = paging.cursors && typeof paging.cursors === "object"
      ? paging.cursors as Row : {};
    const next = string(cursors.after);
    if (!next || next === after || !string(paging.next)) break;
    after = next;
  }
  return result;
}
/**
 * A system-user token can read the Page identity/follower count while Page
 * publishing edges still require the Page access token and Page-specific
 * permissions. Resolve only the official verified SitGuru Page; never log,
 * return or persist the derived Page token.
 *
 * Meta officially supports GET /me/accounts with a system-user token to
 * retrieve its assigned Page access tokens. Fallback to the Page's own
 * access_token field where available.
 */
async function officialFacebookPageToken(systemToken: string, verifiedPageId: string): Promise<string | null> {
  const url = new URL("https://graph.facebook.com/v27.0/me/accounts");
  url.searchParams.set("fields", "id,name,access_token");
  url.searchParams.set("limit", "100");
  try {
    const response = await graphGet(url, systemToken);
    const pageToken = verifiedSitGuruFacebookPageToken(response.data, verifiedPageId);
    if (pageToken) return pageToken;
  } catch {
    // Page listing can be unavailable when pages_show_list has not been
    // approved. We still verify the exact Page identity in the next call.
  }
  try {
    const direct = new URL("https://graph.facebook.com/v27.0/" + verifiedPageId);
    direct.searchParams.set("fields", "id,name,access_token");
    const result = await graphGet(direct, systemToken);
    if (string(result.id) === verifiedPageId && string(result.name) === "SitGuru") {
      return string(result.access_token) || null;
    }
  } catch {
    // Do not attempt to use an unverified Page or log token/error bodies.
  }
  return null;
}

async function getInstagramOwner() {
  const system = string(process.env.META_SYSTEM_USER_ACCESS_TOKEN);
  const instagram = string(process.env.META_INSTAGRAM_ACCESS_TOKEN);
  if (!system && !instagram) throw new Error("Meta Instagram credentials are not configured.");
  if (system) {
    try {
      const identity = await fetchOfficialMetaSnapshot("instagram", {
        token: system, authMode: "facebook_login",
      });
      return {
        token: system,
        host: "graph.facebook.com" as const,
        path: identity.accountId + "/media",
        fields: "id,caption,permalink,media_type,media_product_type,timestamp,thumbnail_url,media_url,like_count,comments_count",
      };
    } catch {
      // An expired FB token may be replaced by a separately authorized
      // Instagram Login token without ever sharing one across API hosts.
    }
  }
  if (instagram) {
    await fetchOfficialMetaSnapshot("instagram", {
      token: instagram, authMode: "instagram_login",
    });
    return {
      token: instagram,
      host: "graph.instagram.com" as const,
      path: "me/media",
      fields: "id,caption,permalink,media_type,timestamp,thumbnail_url,media_url,like_count,comments_count",
    };
  }
  throw new Error("Pinned SitGuru Instagram account could not be verified.");
}
async function optionalInstagramViews(id: string, token: string, host: "graph.facebook.com" | "graph.instagram.com") {
  if (!/^\d+$/.test(id)) return null;
  try {
    // Views are media insights, not a guaranteed field on the media object.
    const url = new URL("https://" + host + "/v27.0/" + id + "/insights");
    url.searchParams.set("metric", "views");
    const payload = await graphGet(url, token);
    const item = Array.isArray(payload.data) ? payload.data[0] as Row | undefined : undefined;
    const aggregate = item?.total_value && typeof item.total_value === "object"
      ? item.total_value as Row : {};
    const values = Array.isArray(item?.values) ? item.values as Row[] : [];
    return {
      views: number(aggregate.value) ?? number(values[0]?.value),
      saves: null,
      shares: null,
    };
  } catch {
    // Insights permission varies by app review, content type and age.
    return null;
  }
}
async function importInstagram(): Promise<ImportedPost[]> {
  const owner = await getInstagramOwner();
  const media = await graphList(owner.host, owner.path, owner.fields, owner.token);
  const results: ImportedPost[] = [];
  for (const row of media) {
    const id = string(row.id);
    const publishedAt = validProviderDate(row.timestamp);
    const publishedUrl = string(row.permalink);
    if (!/^\d+$/.test(id) || !publishedAt || !permalinkKey(publishedUrl)) continue;
    // Supplement list fields only for the latest video posts to limit API load.
    const video = string(row.media_type) === "VIDEO" || string(row.media_product_type) === "REELS";
    const extra = video && results.length < 3
      ? await optionalInstagramViews(id, owner.token, owner.host) : null;
    const caption = string(row.caption);
    results.push({
      id, platform: "instagram", publishedUrl,
      title: caption ? caption.slice(0, 200) : "Instagram " + (video ? "Reel" : "post"),
      publishedAt, thumbnail: string(row.thumbnail_url) || string(row.media_url) || null,
      views: extra?.views ?? null, reach: null,
      likes: number(row.like_count), comments: number(row.comments_count),
      shares: extra?.shares ?? null, saves: extra?.saves ?? null, follows: null,
    });
  }
  return results;
}
async function importFacebook(): Promise<ImportedPost[]> {
  const systemToken = string(process.env.META_SYSTEM_USER_ACCESS_TOKEN);
  if (!systemToken) throw new Error("Facebook system-user credential is not configured.");
  // Refuse to import posts from a Page other than the pinned official SitGuru Page.
  const identity = await fetchOfficialMetaSnapshot("facebook", {
    token: systemToken, authMode: "facebook_login",
  });
  const pageId = identity.accountId;
  const pageToken = await officialFacebookPageToken(systemToken, pageId);

  const richFields =
    "id,message,permalink_url,created_time,full_picture,shares,likes.summary(true),comments.summary(true)";
  const credentials = pageToken && pageToken !== systemToken
    ? [pageToken, systemToken] : [systemToken];
  let posts: Row[] | null = null;
  let lastFailure: unknown = null;

  // Prefer the Page's published_posts edge over /posts: it excludes drafts
  // and ads-only items. Fall back only to official Page posts; never use a
  // person's timeline, unrelated assets or scraped/public content.
  for (const token of credentials) {
    for (const edge of ["published_posts", "posts"] as const) {
      try {
        const retrieved = await graphList("graph.facebook.com", pageId + "/" + edge, richFields, token);
        if (edge === "published_posts" && retrieved.length === 0) continue;
        posts = retrieved;
        break;
      } catch (error) {
        lastFailure = error;
      }
    }
    if (posts !== null) break;
  }
  if (posts === null) {
    if (lastFailure instanceof MetaGraphRequestError) {
      if (lastFailure.apiCode === 190 || lastFailure.status === 401) {
        throw new Error("Facebook Page credential expired or was revoked. Reauthorize SitGuru's official Page.");
      }
      if (lastFailure.status === 429 || lastFailure.apiCode === 80001) {
        throw new Error("Meta rate-limited Facebook post import. Retry after the rate-limit window.");
      }
      if ([200, 283, 10].includes(lastFailure.apiCode ?? 0) || lastFailure.status === 403) {
        throw new Error("Facebook Page post permissions are missing. Grant the official SitGuru Page pages_read_engagement and pages_read_user_content.");
      }
    }
    throw new Error(pageToken
      ? "The SitGuru Facebook Page did not return published posts. Check the Page's Meta app permissions."
      : "Facebook Page access token is unavailable. Assign SitGuru Page access to the Meta system user and approve pages_show_list, pages_read_engagement and pages_read_user_content.");
  }
  const result: ImportedPost[] = [];
  for (const row of posts) {
    const id = string(row.id);
    const publishedAt = validProviderDate(row.created_time);
    const publishedUrl = string(row.permalink_url);
    if (!id || !publishedAt || !permalinkKey(publishedUrl)) continue;
    result.push({
      id, platform: "facebook", publishedUrl,
      title: string(row.message).slice(0, 200) || "Facebook post",
      publishedAt,
      thumbnail: string(row.full_picture) || null,
      views: null, reach: null, likes: summaryCount(row.likes),
      comments: summaryCount(row.comments),
      shares: number((row.shares as Row | null)?.count),
      saves: null, follows: null,
    });
  }
  return result;
}
async function importTikTok(): Promise<{ videos: ImportedPost[]; reason: string | null }> {
  const result = await fetchAuthorizedTikTokVideoList();
  if (!result.available) return { videos: [], reason: result.reason };
  return {
    reason: null,
    videos: result.videos.map((video) => ({
      id: video.id, platform: "tiktok" as const, publishedUrl: video.shareUrl,
      title: video.title, publishedAt: video.publishedAt,
      thumbnail: video.coverImageUrl,
      views: video.views, reach: null, likes: video.likes,
      comments: video.comments, shares: video.shares, saves: null, follows: null,
    })),
  };
}
async function savePosts(platform: SocialChannel, posts: ImportedPost[]) {
  if (!posts.length) return { posts: 0, metricSnapshots: 0 };
  const [{ data: studioRows, error: studioError }, { data: oldRows, error: existingError }] = await Promise.all([
    supabaseAdmin.from("internship_content")
      .select("id,title,published_url,campaign_id").not("published_url", "is", null).limit(600),
    supabaseAdmin.from("growth_social_publications")
      .select("id,provider_post_id,studio_content_id,tracking_key,campaign_slug")
      .eq("platform", platform).in("provider_post_id", posts.map((p) => p.id)),
  ]);
  if (studioError || existingError) throw new Error("Social Intelligence database is not ready for provider import.");
  const studioByUrl = new Map<string, Row>();
  for (const content of studioRows || []) {
    const key = permalinkKey(String(content.published_url || ""));
    if (key) studioByUrl.set(key, content as Row);
  }
  const previous = new Map((oldRows || []).map((row) => [String(row.provider_post_id), row]));
  const campaigns = new Map<string, string>();
  const campaignIds = [...new Set((studioRows || [])
    .map((row) => string(row.campaign_id)).filter(Boolean))];
  if (campaignIds.length) {
    const { data: campaignRows } = await supabaseAdmin.from("internship_campaigns")
      .select("id,utm_campaign").in("id", campaignIds);
    for (const row of campaignRows || []) campaigns.set(String(row.id), string(row.utm_campaign));
  }
  const written = posts.map((post) => {
    const studio = studioByUrl.get(permalinkKey(post.publishedUrl));
    const prior = previous.get(post.id);
    const studioId = string(studio?.id) || string(prior?.studio_content_id);
    return {
      platform: post.platform, provider_post_id: post.id,
      studio_content_id: studioId || null,
      permalink: post.publishedUrl,
      title: string(studio?.title) || post.title,
      thumbnail_url: post.thumbnail,
      published_at: post.publishedAt,
      campaign_slug: string(studio?.campaign_id) ? (campaigns.get(string(studio?.campaign_id)) || "") : string(prior?.campaign_slug),
      tracking_key: studioId ? "sg_" + studioId : string(prior?.tracking_key),
      source: platform === "tiktok" ? "tiktok_display_api" : "meta_graph_api",
      updated_at: new Date().toISOString(),
    };
  });
  const { data: publications, error: writeError } = await supabaseAdmin
    .from("growth_social_publications")
    .upsert(written, { onConflict: "platform,provider_post_id" })
    .select("id,provider_post_id");
  if (writeError || !publications) throw new Error("Could not save verified social post catalog.");
  const byId = new Map(publications.map((row) => [String(row.provider_post_id), String(row.id)]));
  const capturedAt = new Date().toISOString();
  const metricRows = posts.map((post) => ({
    publication_id: byId.get(post.id),
    captured_at: capturedAt, views: post.views, reach: post.reach,
    likes: post.likes, comments: post.comments, shares: post.shares,
    saves: post.saves, follows: post.follows, hook_rate: null,
    average_watch_seconds: null,
    source: platform === "tiktok" ? "tiktok_display_api" : "meta_graph_api",
  })).filter((row) => Boolean(row.publication_id));
  let savedMetrics = 0;
  if (metricRows.length) {
    const { error: metricsError } = await supabaseAdmin
      .from("growth_social_post_metrics").insert(metricRows);
    if (metricsError) throw new Error("Could not store verified provider metric snapshots.");
    savedMetrics = metricRows.length;
  }
  return { posts: publications.length, metricSnapshots: savedMetrics };
}
export async function syncProviderPosts(platform: "facebook" | "instagram" | "tiktok"): Promise<ProviderSyncResult> {
  if (platform === "tiktok") {
    const result = await importTikTok();
    if (result.reason) return { platform, status: "unavailable", posts: 0, metricSnapshots: 0, note: result.reason };
    const saved = await savePosts(platform, result.videos);
    return { platform, status: "imported", ...saved, note: "Verified TikTok account videos imported." };
  }
  const posts = platform === "instagram" ? await importInstagram() : await importFacebook();
  const saved = await savePosts(platform, posts);
  return { platform, status: "imported", ...saved,
    note: "Official Meta post metadata imported; unavailable insight fields remain null." };
}
