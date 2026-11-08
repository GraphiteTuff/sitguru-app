import { NextResponse } from "next/server";
import {
  prepareContentCreative,
  saveContentCreative,
  verifyContentCreative,
} from "@/lib/internship/content-creative-store";
import { findInternByAccount } from "@/lib/internship/queries";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

async function internForRequest() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return findInternByAccount({ userId: user.id, email: user.email });
}

export async function POST(request: Request) {
  const intern = await internForRequest();
  if (!intern) return NextResponse.json({ error: "Sign in as an intern to upload a creative." }, { status: 401 });
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => null) as { action?: string; name?: string; size?: number; path?: string } | null;
    if (!body) return NextResponse.json({ error: "The upload request was empty." }, { status: 400 });
    if (body.action === "prepare") {
      const prepared = await prepareContentCreative({
        internId: intern.id,
        name: String(body.name || ""),
        size: Number(body.size || 0),
      });
      if (prepared.error) return NextResponse.json({ error: prepared.error }, { status: 400 });
      return NextResponse.json(prepared);
    }
    const verified = await verifyContentCreative({
      internId: intern.id,
      path: String(body.path || ""),
      name: String(body.name || ""),
      size: Number(body.size || 0),
    });
    if (verified.error) return NextResponse.json({ error: verified.error }, { status: 400 });
    return NextResponse.json(verified);
  }
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a graphic or video." }, { status: 400 });
  const saved = await saveContentCreative({ internId: intern.id, file });
  if (saved.error) return NextResponse.json({ error: saved.error }, { status: 400 });
  return NextResponse.json(saved);
}
