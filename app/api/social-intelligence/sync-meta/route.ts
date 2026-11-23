import { NextRequest, NextResponse } from "next/server";
import { resolveSocialIntelligenceViewer } from "@/lib/social-intelligence/access";
import { syncOfficialMetaPosts } from "@/lib/social-intelligence/meta-post-sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Manager/Admin initiated import. Same-origin POST and Growth Portal permissions
 * prevent unauthenticated imports, interns cannot trigger cross-team sync.
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const viewer = await resolveSocialIntelligenceViewer(request);
  if (!viewer.ok) {
    return NextResponse.json({ error: viewer.error }, { status: viewer.status });
  }
  if (viewer.internId !== null) {
    return NextResponse.json({ error: "Manager or Admin access required." }, { status: 403 });
  }
  if (process.env.META_SOCIAL_SYNC_ENABLED !== "true") {
    return NextResponse.json(
      { error: "Official Meta sync needs to be enabled in SitGuru's social configuration." },
      { status: 503 },
    );
  }
  const result = await syncOfficialMetaPosts();
  return NextResponse.json(result, {
    headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
  });
}
