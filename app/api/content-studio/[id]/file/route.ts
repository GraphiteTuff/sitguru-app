import { NextResponse } from "next/server";
import { openContentCreative } from "@/lib/internship/content-creative-store";
import { canReviewAssignedContent } from "@/lib/internship/content-studio";
import { findInternByAccount } from "@/lib/internship/queries";
import { getAdminIdentity } from "@/lib/admin/access";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Sign in required.", { status: 401 });
  const { data: row } = await supabaseAdmin
    .from("internship_content")
    .select("id,intern_id,creative_path,creative_name")
    .eq("id", id)
    .maybeSingle();
  if (!row?.creative_path) return new NextResponse("No creative file.", { status: 404 });
  const { data: intern } = await supabaseAdmin
    .from("internship_interns")
    .select("id,manager_user_id,user_id")
    .eq("id", row.intern_id)
    .maybeSingle();
  const own = await findInternByAccount({ userId: user.id, email: user.email });
  const admin = await getAdminIdentity();
  const allowed = own?.id === String(row.intern_id) || canReviewAssignedContent({
    actorUserId: user.id,
    isSuperUser: Boolean(admin?.isSuperUser),
    managerUserId: intern?.manager_user_id ? String(intern.manager_user_id) : null,
  });
  if (!allowed) return new NextResponse("This creative is not available to you.", { status: 403 });
  const download = new URL(request.url).searchParams.get("download") === "1";
  const url = await openContentCreative(String(row.creative_path), download ? String(row.creative_name || "creative") : "");
  if (!url) return new NextResponse("The creative file could not be opened.", { status: 404 });
  return NextResponse.redirect(url, {
    headers: {
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
