import { NextRequest, NextResponse } from "next/server";
import { selectSearchChips } from "@/lib/credentials/model";
import {
  listPublicCredentialMetrics,
  listPublicCredentialsForGurus,
} from "@/lib/credentials/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const metrics = request.nextUrl.searchParams.get("metrics");
  if (metrics === "1") {
    const payload = await listPublicCredentialMetrics();
    return NextResponse.json({ ok: true, ...payload });
  }

  const raw = request.nextUrl.searchParams.get("guruIds") || "";
  const guruKeys = raw.split(",").map((item) => item.trim()).filter(Boolean);
  const result = await listPublicCredentialsForGurus(guruKeys);
  const byGuru: Record<string, ReturnType<typeof selectSearchChips> & { highlights: typeof result.highlights }> = {};

  for (const highlight of result.highlights) {
    const keys = [highlight.guruId, highlight.ownerUserId].filter(Boolean);
    for (const key of keys) {
      byGuru[key] = byGuru[key] || { chips: [], extraCount: 0, highlights: [] };
      byGuru[key].highlights.push(highlight);
    }
  }

  const chipsByGuruId = Object.fromEntries(
    Object.entries(byGuru).map(([key, value]) => {
      const selected = selectSearchChips(value.highlights);
      return [key, { ...selected, highlights: value.highlights }];
    }),
  );

  return NextResponse.json({
    ok: true,
    enabled: result.enabled,
    filtersEnabled: result.filtersEnabled === true,
    chipsByGuruId,
  });
}
