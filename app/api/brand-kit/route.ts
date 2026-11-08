import { NextRequest, NextResponse } from "next/server";
import {
  abandonBrandUpload,
  listBrandAssets,
  prepareBrandUpload,
  resolveBrandActor,
  verifyBrandUpload,
} from "@/lib/manager/brand-kit-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const actor = await resolveBrandActor();
  if (!actor) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const listed = await listBrandAssets({
    actor,
    query: req.nextUrl.searchParams.get("q") || "",
    category: req.nextUrl.searchParams.get("category") || "",
    status: req.nextUrl.searchParams.get("status") || "",
  });
  if (listed.error === "Not allowed.") {
    return NextResponse.json({ error: listed.error }, { status: 403 });
  }
  return NextResponse.json({ assets: listed.assets, error: listed.error });
}

export async function POST(req: NextRequest) {
  const actor = await resolveBrandActor();
  if (!actor) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const action = String(body?.action || "");
  if (action === "prepare") {
    const result = await prepareBrandUpload({
      actor,
      fileName: String(body.fileName || ""),
      declaredMime: String(body.declaredMime || ""),
      declaredSize: Number(body.declaredSize || 0),
      category: String(body.category || ""),
      title: String(body.title || ""),
      description: String(body.description || ""),
      tags: body.tags,
      replacesId: String(body.replacesId || ""),
    });
    return NextResponse.json(result, { status: result.error ? 400 : 200 });
  }
  if (action === "verify") {
    const result = await verifyBrandUpload({ actor, id: String(body.id || "") });
    return NextResponse.json(result, { status: result.error ? 400 : 200 });
  }
  if (action === "abandon") {
    const result = await abandonBrandUpload({ actor, id: String(body.id || "") });
    return NextResponse.json(result, { status: result.error ? 400 : 200 });
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
