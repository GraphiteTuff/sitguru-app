import { NextResponse } from "next/server";
import { syncProviderPosts } from "@/lib/social-intelligence/provider-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Protected provider snapshot import. Disabled until database and scopes are verified. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== "Bearer " + secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (process.env.SOCIAL_INTELLIGENCE_SYNC_ENABLED !== "true") {
    return NextResponse.json(
      { ok: true, enabled: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const platforms = ["facebook", "instagram", "tiktok"] as const;
  const attempts = await Promise.allSettled(platforms.map((platform) => syncProviderPosts(platform)));
  const results = attempts.map((result, index) => {
    if (result.status === "fulfilled") return result.value;
    // Do not expose raw Graph API errors or any provider/DB credentials.
    console.error("Social Intelligence post-sync failed:", platforms[index],
      result.reason instanceof Error ? result.reason.name : "UnknownError");
    return {
      platform: platforms[index], status: "unavailable" as const,
      posts: 0, metricSnapshots: 0,
      note: "Provider permissions, API access, or database readiness must be checked.",
    };
  });
  const ok = results.some((result) => result.status === "imported");
  return NextResponse.json(
    { ok, enabled: true, results },
    { status: ok ? 200 : 502, headers: { "Cache-Control": "no-store" } },
  );
}
