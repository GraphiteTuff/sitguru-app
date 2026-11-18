import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAdminIdentity } from "@/lib/admin/access";
import { connectTikTokCode, TIKTOK_REDIRECT_URI } from "@/lib/tiktok/social-analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATE_COOKIE = "sitguru_tiktok_oauth_state";
const UPLOAD_COOKIE = "sitguru_tiktok_oauth_upload";
const FINISH_URL = `${new URL(TIKTOK_REDIRECT_URI).origin}/manager/results`;

function finish(status: string, uploadFlow = false): NextResponse {
  const destination = new URL(uploadFlow ? `${new URL(TIKTOK_REDIRECT_URI).origin}/manager/campaigns-content` : FINISH_URL);
  destination.searchParams.set("tiktok", status);
  const response = NextResponse.redirect(destination);
  response.cookies.set(STATE_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/api/integrations/tiktok",
    maxAge: 0,
  });
  response.cookies.set(UPLOAD_COOKIE, "", {
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
  const uploadFlow = request.cookies.get(UPLOAD_COOKIE)?.value === "1";
  const suppliedState = request.nextUrl.searchParams.get("state") || "";
  const code = request.nextUrl.searchParams.get("code") || "";
  if (!equalState(storedState, suppliedState)) {
    return finish("invalid_state", uploadFlow);
  }
  if (request.nextUrl.searchParams.has("error")) {
    return finish("cancelled", uploadFlow);
  }
  if (!code || code.length > 4096) {
    return finish("invalid_code", uploadFlow);
  }

  try {
    await connectTikTokCode(code, uploadFlow);
    return finish(uploadFlow ? "upload_authorized" : "connected", uploadFlow);
  } catch {
    // Never return TikTok OAuth codes, secrets, tokens, or provider raw errors.
    return finish("connection_failed", uploadFlow);
  }
}