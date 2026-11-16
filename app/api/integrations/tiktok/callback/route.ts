import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAdminIdentity } from "@/lib/admin/access";
import { connectTikTokCode } from "@/lib/tiktok/social-analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATE_COOKIE = "sitguru_tiktok_oauth_state";
const FINISH_URL = "https://www.sitguru.com/manager/results";

function finish(status: string): NextResponse {
  const destination = new URL(FINISH_URL);
  destination.searchParams.set("tiktok", status);
  const response = NextResponse.redirect(destination);
  response.cookies.set(STATE_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/api/integrations/tiktok",
    maxAge: 0,
  });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

function equalState(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  return (
    left.length > 0 &&
    left.length === right.length &&
    timingSafeEqual(left, right)
  );
}

export async function GET(request: NextRequest) {
  const identity = await getAdminIdentity();
  if (!identity?.isSuperUser) {
    return NextResponse.json({ error: "Founder or superuser access required." }, { status: 403 });
  }

  const storedState = request.cookies.get(STATE_COOKIE)?.value || "";
  const suppliedState = request.nextUrl.searchParams.get("state") || "";
  const code = request.nextUrl.searchParams.get("code") || "";
  if (!equalState(storedState, suppliedState)) {
    return finish("invalid_state");
  }
  if (request.nextUrl.searchParams.has("error")) {
    return finish("cancelled");
  }
  if (!code || code.length > 4096) {
    return finish("invalid_code");
  }

  try {
    await connectTikTokCode(code);
    return finish("connected");
  } catch {
    // Never return TikTok OAuth codes, secrets, tokens, or provider raw errors.
    return finish("connection_failed");
  }
}