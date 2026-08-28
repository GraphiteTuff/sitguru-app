import { NextRequest, NextResponse } from "next/server";
import { requirePartnerAccount } from "@/lib/community/partner-access";
import { fetchPartnerEvents } from "@/lib/community/queries";
import { createPartnerEventDraft } from "@/app/partners/dashboard/community/events/actions";
import type { PartnerEventTab } from "@/lib/community/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const access = await requirePartnerAccount();

  if (!access.ok || !access.partner) {
    return NextResponse.json({ error: access.error }, { status: 401 });
  }

  const tab = (req.nextUrl.searchParams.get("tab") || "upcoming") as PartnerEventTab;
  const events = await fetchPartnerEvents(access.partner.id, tab);

  return NextResponse.json({ events, partner: access.partner });
}

export async function POST(req: NextRequest) {
  const access = await requirePartnerAccount();

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const result = await createPartnerEventDraft(body);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ event: result.event });
}
