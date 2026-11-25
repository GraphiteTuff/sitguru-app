import { NextRequest, NextResponse } from "next/server";
import { currentOutlookIdentity } from "@/lib/microsoft/outlook/access";
import { connectOutlook } from "@/lib/microsoft/outlook/graph";
import { checkedOutlookFlow, openOutlookValue, OUTLOOK_FLOW_COOKIE, outlookPortal, outlookSettings, type OutlookFlow } from "@/lib/microsoft/outlook/security";

export async function GET(request: NextRequest) {
  const settings = outlookSettings();
  if (!settings) return new Response("Outlook is unavailable.", { status: 503 });
  const value = request.cookies.get(OUTLOOK_FLOW_COOKIE)?.value;
  const initial = value ? openOutlookValue<OutlookFlow>(settings.key, "outlook:flow", value) : null;
  const portal = outlookPortal(initial?.portal);
  const query = request.nextUrl.searchParams;
  const destination = new URL(portal ? `/${portal}/outlook` : "/", settings.callback.origin);
  const redirect = (result: string) => {
    destination.searchParams.set("result", result);
    const response = NextResponse.redirect(destination, 303);
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    response.cookies.set(OUTLOOK_FLOW_COOKIE, "", { maxAge: 0, path: "/api/internship/outlook" });
    return response;
  };
  const identity = portal ? await currentOutlookIdentity(portal) : null;
  const flow = identity ? checkedOutlookFlow(initial, identity.userId, query.get("state")) : null;
  if (!flow) return redirect("invalid");
  const code = query.get("code");
  if (!code || query.has("error")) return redirect("declined");
  try {
    await connectOutlook(settings, flow, code);
    return redirect("connected");
  } catch {
    return redirect("unavailable");
  }
}
