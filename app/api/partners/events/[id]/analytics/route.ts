import { NextRequest, NextResponse } from "next/server";
import { getEventPromotionStats } from "@/lib/community/event-analytics";
import { requirePartnerAccount } from "@/lib/community/partner-access";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
  const access = await requirePartnerAccount();

  if (!access.ok || !access.partner) {
    return NextResponse.json({ error: access.error }, { status: 401 });
  }

  const { id } = await context.params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("community_events")
    .select("id, slug, partner_id")
    .eq("id", id)
    .eq("partner_id", access.partner.id)
    .maybeSingle();

  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const stats = await getEventPromotionStats(event.id, event.slug);

  return NextResponse.json({ stats });
}
