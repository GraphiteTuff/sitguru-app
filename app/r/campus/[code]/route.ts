import { NextRequest, NextResponse } from "next/server";
import { campusAttributionReward, campusDestinationForTarget } from "@/lib/internship/campus-growth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const clean = decodeURIComponent(code || "").trim().toLowerCase();
  const reward = campusAttributionReward();
  let target = "awareness";
  let channel = "link";
  if (!reward.grantsAmbassadorReward && clean) {
    const { data: link } = await supabaseAdmin
      .from("campus_growth_links")
      .select("id,intern_id,target_type,channel,grants_reward")
      .eq("code", clean)
      .maybeSingle();
    if (link?.id && link.grants_reward !== true) {
      target = String(link.target_type || "awareness");
      channel = String(link.channel || "link");
      const scan = request.nextUrl.searchParams.get("scan") === "1";
      await supabaseAdmin.from("campus_growth_visits").insert({
        link_id: link.id,
        intern_id: link.intern_id,
        code: clean,
        kind: scan ? "qr_scan" : "visit",
      });
    }
  }
  const destination = new URL(campusDestinationForTarget(target), request.url);
  destination.searchParams.set("campus", clean);
  destination.searchParams.set("utm_source", "sitguru_campus");
  destination.searchParams.set("utm_medium", channel);
  destination.searchParams.set("utm_campaign", clean);
  return NextResponse.redirect(destination);
}
