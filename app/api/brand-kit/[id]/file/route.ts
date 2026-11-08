import { NextResponse } from "next/server";
import { openBrandAssetFile, resolveBrandActor } from "@/lib/manager/brand-kit-store";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const actor = await resolveBrandActor();
  if (!actor) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { id } = await context.params;
  const file = await openBrandAssetFile({ actor, id });
  if (file.error) {
    return NextResponse.json({ error: file.error }, { status: file.status || 404 });
  }
  if ("redirectUrl" in file && file.redirectUrl) {
    return NextResponse.redirect(file.redirectUrl);
  }
  if ("bytes" in file && file.bytes) {
    return new NextResponse(file.bytes, {
      headers: {
        "Content-Type": file.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${String(file.fileName || "brand-file").replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
  return NextResponse.json({ error: "File not found." }, { status: 404 });
}
