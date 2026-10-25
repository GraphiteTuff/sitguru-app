import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { getAdminIdentity } from "@/lib/admin/access";
import { canEditRequirements, internshipActorKind } from "@/lib/internship/manager-access";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED = new Set([
  "growth-manager-handbook-v1.pdf",
  "independent-contractor-agreement-v1.pdf",
  "intern-leadership-guide-v1.pdf",
  "approved-systems-policy-v1.pdf",
  "messaging-communications-policy-v1.pdf",
  "onboarding-policy-acknowledgment-v1.pdf",
]);

export async function GET(request: NextRequest) {
  const versionId = request.nextUrl.searchParams.get("version") || "";
  if (!versionId) return NextResponse.json({ error: "Missing document." }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = await getAdminIdentity();
  const userId = admin?.id || user?.id || "";
  if (!userId) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const founder = canEditRequirements(
    internshipActorKind({ role: admin?.role, isSuperUser: admin?.isSuperUser }),
  );
  const { data: version } = await supabaseAdmin
    .from("onboarding_document_versions")
    .select("id,storage_ref")
    .eq("id", versionId)
    .maybeSingle();
  const fileName = path.basename(String(version?.storage_ref || ""));
  if (!ALLOWED.has(fileName)) return NextResponse.json({ error: "Document not available." }, { status: 404 });

  if (!founder) {
    const { data: items } = await supabaseAdmin
      .from("onboarding_items")
      .select("instance_id")
      .eq("version_id", versionId);
    const instanceIds = (items || []).map((row) => String(row.instance_id));
    const { data: mine } = instanceIds.length
      ? await supabaseAdmin
          .from("onboarding_instances")
          .select("id")
          .in("id", instanceIds)
          .eq("subject_user_id", userId)
          .limit(1)
      : { data: [] };
    if (!mine?.length) return NextResponse.json({ error: "You cannot open this personnel document." }, { status: 403 });
  }

  const bytes = await readFile(path.join(process.cwd(), "private", "onboarding", fileName));
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${fileName}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
