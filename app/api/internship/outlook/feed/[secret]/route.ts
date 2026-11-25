import { outlookSettings } from "@/lib/microsoft/outlook/security";
import { readCalendarSubscription } from "@/lib/microsoft/outlook/subscriptions";

export async function GET(_request: Request, { params }: { params: Promise<{ secret: string }> }) {
  const headers = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow", "Referrer-Policy": "no-referrer" };
  if (!outlookSettings()) return new Response("Calendar subscription not found.", { status: 404, headers });
  const { secret } = await params;
  try {
    const feed = await readCalendarSubscription(secret);
    if (!feed) return new Response("Calendar subscription not found.", { status: 404, headers });
    return new Response(feed, { headers: { ...headers, "Content-Type": "text/calendar; charset=utf-8" } });
  } catch {
    return new Response("Calendar temporarily unavailable.", { status: 503, headers });
  }
}
