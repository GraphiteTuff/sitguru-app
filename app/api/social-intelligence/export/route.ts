import { NextRequest, NextResponse } from "next/server";
import { parseFiltersFromSearch } from "@/lib/growth-center-v2/date-range";
import { resolveSocialIntelligenceViewer } from "@/lib/social-intelligence/access";
import { loadSocialIntelligenceSnapshot } from "@/lib/social-intelligence/dashboard";

export const dynamic = "force-dynamic";

function csvCell(value: unknown) {
  const raw = String(value ?? "").replace(/[\r\n]+/g, " ");
  // Protect Excel/Sheets from formula execution when exporting untrusted titles and URLs.
  const safe = /^[\s]*[=+\-@]/.test(raw) ? "'" + raw : raw;
  return '"' + safe.replaceAll('"', '""') + '"';
}
function csvRow(fields: unknown[]) {
  return fields.map(csvCell).join(",");
}
export async function GET(request: NextRequest) {
  const viewer = await resolveSocialIntelligenceViewer(request);
  if (!viewer.ok) return NextResponse.json(
    { error: viewer.error }, { status: viewer.status, headers: { "Cache-Control": "private, no-store" } },
  );
  const filters = parseFiltersFromSearch(request.nextUrl.searchParams);
  const snapshot = await loadSocialIntelligenceSnapshot({ filters, internId: viewer.internId });
  const lines = [
    csvRow(["SitGuru Social Intelligence","Period",snapshot.rangeLabel]),
    csvRow(["Data as of",snapshot.capturedAt,"Provider data may lag"]),
    csvRow(["Summary","Tracked site page views",snapshot.total.pageViews]),
    csvRow(["Summary","Tracked link clicks",snapshot.total.linkClicks]),
    csvRow(["Summary","Attributed signup events",snapshot.total.signupEvents]),
    csvRow(["Summary","Tracked booking events (not paid)",snapshot.total.bookingEvents]),
    csvRow(["Summary","Verified paid bookings","Unavailable"]),
    csvRow(["Summary","Net revenue attributable to social","Unavailable"]),
    "",
    csvRow(["Date","Tracked site views","Tracked link clicks","Signup events","Booking events"]),
    ...snapshot.daily.map((day) => csvRow([
      day.date,day.pageViews,day.linkClicks,day.signupEvents,day.bookingEvents,
    ])),
    "",
    csvRow([
      "Post","Platform","Published URL","Campaign","Provider views","Reach",
      "Likes","Comments","Shares","Saves","Follows","Hook rate",
      "Average watch (sec)","Tracked page views","Clicks","Signup events","Booking events","Provider sync",
    ]),
    ...snapshot.posts.map((post) => csvRow([
      post.title,post.channel,post.publishedUrl,post.campaignSlug,
      post.metrics.views,post.metrics.reach,post.metrics.likes,post.metrics.comments,
      post.metrics.shares,post.metrics.saves,post.metrics.follows,post.metrics.hookRate,
      post.metrics.averageWatchSeconds,post.impact.pageViews,post.impact.linkClicks,
      post.impact.signupEvents,post.impact.bookingEvents,post.metrics.capturedAt,
    ])),
  ];
  return new NextResponse("\uFEFF" + lines.join("\r\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="SitGuru-Social-Intelligence.csv"',
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
