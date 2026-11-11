import { NextResponse } from "next/server";
import { persistReadsAnalyticsEvent } from "@/lib/reads/analytics";
import type { ReadsAnalyticsEventName } from "@/lib/reads/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const eventName = String(body.eventName || "") as ReadsAnalyticsEventName;
    if (!eventName) {
      return NextResponse.json({ error: "eventName required" }, { status: 400 });
    }

    await persistReadsAnalyticsEvent({
      eventName,
      contentId: body.contentId || undefined,
      contentType: body.contentType || undefined,
      pagePath: body.pagePath || undefined,
      referrer: body.referrer || request.headers.get("referer") || undefined,
      sessionId: body.sessionId || undefined,
      userId: body.userId || undefined,
      utm: body.utm || undefined,
      metadata: body.metadata || {},
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("reads analytics error", error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
