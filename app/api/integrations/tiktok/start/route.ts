import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getAdminIdentity } from "@/lib/admin/access";
import {
  getTikTokConfig,
  makeTikTokAuthorizationUrl,
} from "@/lib/tiktok/social-analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATE_COOKIE = "sitguru_tiktok_oauth_state";
const UPLOAD_COOKIE = "sitguru_tiktok_oauth_upload";

export async function GET(request: Request) {
  const identity = await getAdminIdentity();
  if (!identity?.isSuperUser) {
    return NextResponse.json({ error: "Founder or superuser access required." }, { status: 403 });
  }
  try {
    const config = getTikTokConfig();
    const state = randomBytes(32).toString("base64url");
    const includeUpload = new URL(request.url).searchParams.get("upload") === "1";
    const response = NextResponse.redirect(
      makeTikTokAuthorizationUrl(config.clientKey, state, includeUpload),
    );
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    response.cookies.set(STATE_COOKIE, state, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 600,
      path: "/api/integrations/tiktok",
    });
    response.cookies.set(UPLOAD_COOKIE, includeUpload ? "1" : "0", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 600,
      path: "/api/integrations/tiktok",
    });
    return response;
  } catch {
    return NextResponse.json(
      { error: "TikTok integration is not configured or enabled." },
      { status: 503 },
    );
  }
}