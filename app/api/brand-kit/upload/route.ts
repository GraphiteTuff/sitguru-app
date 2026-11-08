import { NextRequest, NextResponse } from "next/server";
import { resolveBrandActor, saveBrandFile } from "@/lib/manager/brand-kit-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const actor = await resolveBrandActor();
    if (!actor) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    if (!actor.capabilities.upload) {
      return NextResponse.json({ error: "You cannot upload brand files." }, { status: 403 });
    }
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Choose a file." }, { status: 400 });
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = await saveBrandFile({
      actor,
      bytes,
      fileName: file.name,
      declaredMime: file.type,
      category: String(form.get("category") || ""),
      title: String(form.get("title") || ""),
      description: String(form.get("description") || ""),
      tags: String(form.get("tags") || ""),
      replacesId: String(form.get("replacesId") || ""),
    });
    return NextResponse.json(result, { status: result.error ? 400 : 200 });
  } catch (error) {
    console.error("[brand-kit/upload]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "SitGuru could not store that file." },
      { status: 500 },
    );
  }
}
