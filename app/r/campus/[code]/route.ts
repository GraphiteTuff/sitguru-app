import { NextRequest, NextResponse } from "next/server";
import { campusAttributionReward } from "@/lib/internship/campus-growth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const clean = decodeURIComponent(code || "").trim().toLowerCase();
  const reward = campusAttributionReward();
  if (!reward.grantsAmbassadorReward && clean) {
    const { data: link } = await supabaseAdmin
      .from("campus_growth_links")
      .select("id,intern_id,target_type,grants_reward")
      .eq("code", clean)
      .maybeSingle();
    if (link?.id && link.grants_reward !== true) {
      const scan = request.nextUrl.searchParams.get("scan") === "1";
      await supabaseAdmin.from("campus_growth_visits").insert({
        link_id: link.id,
        intern_id: link.intern_id,
        code: clean,
        kind: scan ? "qr_scan" : "visit",
      });
    }
  }
  const destination = new URL("/", request.url);
  destination.searchParams.set("campus", clean);
  return NextResponse.redirect(destination);
}
