import { NextResponse } from "next/server";
import { syncProviderPosts } from "@/lib/social-intelligence/provider-sync";
import { syncOfficialMetaPosts } from "@/lib/social-intelligence/meta-post-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Protected provider snapshot import. Disabled until database and scopes are verified. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== "Bearer " + secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const metaEnabled = process.env.META_SOCIAL_SYNC_ENABLED === "true";
  const tiktokEnabled = process.env.SOCIAL_INTELLIGENCE_SYNC_ENABLED === "true";
  if (!metaEnabled && !tiktokEnabled) {
    return NextResponse.json({ ok: true, enabled: false }, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  // Meta uses the already validated official follower-sync configuration.
  // TikTok remains separate and does not run unless explicitly enabled.
  const meta = metaEnabled ? await syncOfficialMetaPosts({ automated: true }) : null;
  const tiktok = tiktokEnabled ? await Promise.allSettled([syncProviderPosts("tiktok")]) : [];
  const tiktokOutcome = tiktok.map((entry) =>
    entry.status === "fulfilled" ? entry.value : {
      platform: "tiktok", status: "unavailable", posts: 0,
      note: "TikTok post-level API authorization is not yet available.",
    },
  );
  const results = [...(meta?.results || []), ...tiktokOutcome];
  return NextResponse.json({ ok: true, enabled: true, results }, {
    headers: { "Cache-Control": "no-store" },
  });
}
