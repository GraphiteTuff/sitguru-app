import { NextRequest, NextResponse } from "next/server";
import { getEventPromotionStats } from "@/lib/community/event-analytics";
import { requireEventHostPartnerAccountFromRequest } from "@/lib/community/partner-access";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  mobileCorsHeaders,
  optionsWithMobileCors,
} from "@/lib/supabase/request-auth";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export function OPTIONS(req: NextRequest) {
  return optionsWithMobileCors(req);
}

export async function GET(req: NextRequest, context: RouteContext) {
  const access = await requireEventHostPartnerAccountFromRequest(req);

  if (!access.ok || !access.partner) {
    return NextResponse.json(
      { error: access.error },
      { status: 401, headers: mobileCorsHeaders(req) },
    );
  }

  const { id } = await context.params;

  const { data: event } = await supabaseAdmin
    .from("community_events")
    .select("id, slug, partner_id")
    .eq("id", id)
    .eq("partner_id", access.partner.id)
    .maybeSingle();

  if (!event) {
    return NextResponse.json(
      { error: "Event not found." },
      { status: 404, headers: mobileCorsHeaders(req) },
    );
  }

  const stats = await getEventPromotionStats(event.id, event.slug);

  return NextResponse.json(
    { stats },
    { headers: mobileCorsHeaders(req) },
  );
}
