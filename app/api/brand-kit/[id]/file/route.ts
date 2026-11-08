import { NextRequest, NextResponse } from "next/server";
import { openBrandAssetFile, resolveBrandActor } from "@/lib/manager/brand-kit-store";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  const actor = await resolveBrandActor();
  if (!actor) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { id } = await context.params;
  const download = req.nextUrl.searchParams.get("download") === "1";
  const file = await openBrandAssetFile({ actor, id, download });
  if (file.error || !("redirectUrl" in file) || !file.redirectUrl) {
    return NextResponse.json({ error: file.error || "File not found." }, { status: file.status || 404 });
  }
  if (download && req.nextUrl.searchParams.get("format") === "json") {
    return NextResponse.json(
      { fileName: file.fileName, url: file.redirectUrl, expiresIn: 60 },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }
  const response = NextResponse.redirect(file.redirectUrl);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
