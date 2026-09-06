import { NextRequest, NextResponse } from "next/server";
import { getAdminIdentity } from "@/lib/admin/access";
import { findInternByAccount, getInternOnboarding } from "@/lib/internship/queries";
import { signedInternshipConfidentialUrl } from "@/lib/internship/storage";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const internId = String(req.nextUrl.searchParams.get("internId") || "").trim();
  if (!internId) return NextResponse.json({ error: "Missing intern." }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const intern = await findInternByAccount({
    userId: user.id,
    email: user.email,
  });
  const admin = await getAdminIdentity();
  const allowed = intern?.id === internId || Boolean(admin?.canAccessAdmin);
  if (!allowed) return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const ack = await getInternOnboarding(internId);
  if (!ack?.wetInkStoragePath) {
    return NextResponse.json({ error: "No signed page uploaded." }, { status: 404 });
  }

  const url = await signedInternshipConfidentialUrl(ack.wetInkStoragePath);
  if (!url) return NextResponse.json({ error: "File unavailable." }, { status: 404 });
  return NextResponse.redirect(url);
}
