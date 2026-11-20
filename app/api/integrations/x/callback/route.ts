import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAdminIdentity } from "@/lib/admin/access";
import { connectXCode, getXConfig } from "@/lib/x/social-analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_PATH = "/api/integrations/x";
const STATE_COOKIE = "sitguru_x_oauth_state";
const VERIFIER_COOKIE = "sitguru_x_oauth_verifier";

function equalState(left: string, right: string): boolean {
  const a = Buffer.from(left, "utf8");
  const b = Buffer.from(right, "utf8");
  return a.length > 0 && a.length === b.length && timingSafeEqual(a, b);
}

function finish(origin: string, result: string): NextResponse {
  const url = new URL("/manager/results", origin);
  url.searchParams.set("x", result);
  const response = NextResponse.redirect(url);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  for (const name of [STATE_COOKIE, VERIFIER_COOKIE]) {
    response.cookies.set(name, "", { httpOnly: true, secure: true, sameSite: "lax", maxAge: 0, path: COOKIE_PATH });
  }
  return response;
}

export async function GET(request: NextRequest) {
  const identity = await getAdminIdentity();
  if (!identity?.isSuperUser) {
    return NextResponse.json({ error: "Founder or superuser access required." }, { status: 403 });
  }
  let origin: string;
  try {
    origin = new URL(getXConfig().redirectUri).origin;
  } catch {
    return NextResponse.json({ error: "X OAuth is not configured." }, { status: 503 });
  }
  if (request.nextUrl.origin !== origin) {
    return NextResponse.json({ error: "X OAuth callback origin does not match configuration." }, { status: 400 });
  }
  const state = request.cookies.get(STATE_COOKIE)?.value || "";
  const verifier = request.cookies.get(VERIFIER_COOKIE)?.value || "";
  const providedState = request.nextUrl.searchParams.get("state") || "";
  if (!equalState(state, providedState) || verifier.length < 43 || verifier.length > 128) {
    return finish(origin, "invalid_state");
  }
  if (request.nextUrl.searchParams.has("error")) return finish(origin, "cancelled");
  const code = request.nextUrl.searchParams.get("code") || "";
  if (!code || code.length > 4096) return finish(origin, "invalid_code");
  try {
    await connectXCode(code, verifier);
    return finish(origin, "connected");
  } catch {
    // Never expose authorization codes, provider errors, keys, or tokens.
    return finish(origin, "connection_failed");
  }
}
