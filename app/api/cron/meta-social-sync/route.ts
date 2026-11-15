import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  fetchOfficialMetaSnapshot,
  persistOfficialMetaSnapshot,
  type MetaPlatform,
} from "@/lib/meta/social-analytics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Protected Vercel Cron: near-live snapshots, not fabricated follower counts.
 * The activation flag prevents sync until secure credentials are installed and
 * the existing production database connection has been verified.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.META_SOCIAL_SYNC_ENABLED !== "true") {
    return NextResponse.json(
      { ok: true, enabled: false, note: "Meta social sync is not activated." },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const platforms: readonly MetaPlatform[] = ["facebook", "instagram"];
  const results = await Promise.all(
    platforms.map(async (platform) => {
      try {
        const snapshot = await fetchOfficialMetaSnapshot(platform);
        const saved = await persistOfficialMetaSnapshot(supabaseAdmin, snapshot);
        return { ok: true, ...saved };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown sync error";
        // Neither the token nor the raw Meta error response is ever logged.
        console.error(`Meta social sync (${platform}):`, message);
        return { platform, ok: false, error: message };
      }
    }),
  );

  const ok = results.every((result) => result.ok);
  return NextResponse.json(
    { ok, enabled: true, results },
    {
      status: ok ? 200 : 502,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
