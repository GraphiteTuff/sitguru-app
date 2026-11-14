import { NextRequest, NextResponse } from "next/server";
import { approveInitialBrandAssets, resolveBrandActor } from "@/lib/manager/brand-kit-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin && origin !== req.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const actor = await resolveBrandActor();
  if (!actor?.isSuperUser) {
    return NextResponse.json({ error: "Super Admin access required." }, { status: 403 });
  }
  const result = await approveInitialBrandAssets(actor);
  return NextResponse.json(result, {
    status: result.error ? 500 : 200,
    headers: { "Cache-Control": "private, no-store" },
  });
}
