import { NextRequest, NextResponse } from "next/server";
import { mobileCorsHeaders, optionsWithMobileCors } from "@/lib/supabase/request-auth";
import { parseFiltersFromSearch } from "@/lib/growth-center-v2/date-range";
import { resolveSocialIntelligenceViewer } from "@/lib/social-intelligence/access";
import { loadSocialIntelligenceSnapshot } from "@/lib/social-intelligence/dashboard";

export const dynamic = "force-dynamic";
export function OPTIONS(request: NextRequest) {
  return optionsWithMobileCors(request);
}
function response(request: NextRequest, body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { ...mobileCorsHeaders(request), "Cache-Control": "private, no-store" },
  });
}

export async function GET(request: NextRequest) {
  const viewer = await resolveSocialIntelligenceViewer(request);
  if (!viewer.ok) return response(request, { error: viewer.error }, viewer.status);
  const filters = parseFiltersFromSearch(request.nextUrl.searchParams);
  const snapshot = await loadSocialIntelligenceSnapshot({ filters, internId: viewer.internId });
  return response(request, snapshot);
}
