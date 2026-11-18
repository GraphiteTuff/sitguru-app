import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getAdminIdentity } from "@/lib/admin/access";
import { getXConfig, makeXAuthorizationUrl, makeXVerifier } from "@/lib/x/social-analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_PATH = "/api/integrations/x";
const STATE_COOKIE = "sitguru_x_oauth_state";
const VERIFIER_COOKIE = "sitguru_x_oauth_verifier";

export async function GET() {
  const identity = await getAdminIdentity();
  if (!identity?.isSuperUser) {
    return NextResponse.json({ error: "Founder or superuser access required." }, { status: 403 });
  }
  try {
    const config = getXConfig();
    const state = randomBytes(32).toString("base64url");
    const verifier = makeXVerifier();
    const response = NextResponse.redirect(makeXAuthorizationUrl(config, state, verifier));
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    for (const [name, value] of [[STATE_COOKIE, state], [VERIFIER_COOKIE, verifier]]) {
      response.cookies.set(name, value, {
        httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: COOKIE_PATH,
      });
    }
    return response;
  } catch {
    return NextResponse.json({ error: "X OAuth is not configured or enabled." }, { status: 503 });
  }
}
