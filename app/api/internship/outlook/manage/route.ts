import { NextRequest, NextResponse } from "next/server";
import { currentOutlookIdentity } from "@/lib/microsoft/outlook/access";
import { disconnectOutlook, outlookAuthorization } from "@/lib/microsoft/outlook/graph";
import { changeCalendarSubscription } from "@/lib/microsoft/outlook/subscriptions";
import {
  OUTLOOK_FLOW_COOKIE, OUTLOOK_FLOW_SECONDS, outlookPortal, outlookSecret, outlookSettings, sealOutlookValue,
} from "@/lib/microsoft/outlook/security";

export async function POST(request: NextRequest) {
  const settings = outlookSettings();
  if (!settings) return new Response("Outlook is unavailable.", { status: 503 });
  if (request.headers.get("origin") !== settings.callback.origin) return new Response("Forbidden", { status: 403 });
  const form = await request.formData().catch(() => null);
  const portal = outlookPortal(form?.get("portal"));
  if (!portal) return new Response("Invalid portal", { status: 400 });
  const identity = await currentOutlookIdentity(portal);
  if (!identity) return new Response("Forbidden", { status: 403 });
  const destination = new URL(`/${portal}/outlook`, settings.callback.origin);
  const action = form?.get("action");
  if (form?.get("view") === "calendar") destination.searchParams.set("view", "calendar");

  if (action === "connect") {
    const flow = { portal, userId: identity.userId, state: outlookSecret(),
      verifier: outlookSecret(), expires: Date.now() + OUTLOOK_FLOW_SECONDS * 1000 };
    const response = NextResponse.redirect(outlookAuthorization(settings, flow), 303);
    response.headers.set("Cache-Control", "private, no-store");
    response.cookies.set(OUTLOOK_FLOW_COOKIE, sealOutlookValue(settings.key, "outlook:flow", flow), {
      httpOnly: true, secure: true, sameSite: "lax", path: "/api/internship/outlook", maxAge: OUTLOOK_FLOW_SECONDS,
    });
    return response;
  }

  try {
    if (action === "disconnect") await disconnectOutlook(identity.userId);
    else if (action === "subscribe" || action === "revoke") {
      await changeCalendarSubscription(settings, identity.userId, portal, action === "revoke");
    } else return new Response("Invalid action", { status: 400 });
    destination.searchParams.set("result", "updated");
  } catch {
    destination.searchParams.set("result", "unavailable");
  }
  const response = NextResponse.redirect(destination, 303);
  response.headers.set("Cache-Control", "private, no-store");
  if (action === "disconnect") response.cookies.set(OUTLOOK_FLOW_COOKIE, "", { maxAge: 0, path: "/api/internship/outlook" });
  return response;
}
