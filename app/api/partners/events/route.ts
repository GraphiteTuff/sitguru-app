import { NextRequest, NextResponse } from "next/server";
import { requireEventHostPartnerAccountFromRequest } from "@/lib/community/partner-access";
import { createPartnerEventDraftWithAccess } from "@/lib/community/partner-event-mutations";
import { fetchPartnerEvents } from "@/lib/community/queries";
import type { PartnerEventTab } from "@/lib/community/types";
import {
  mobileCorsHeaders,
  optionsWithMobileCors,
} from "@/lib/supabase/request-auth";

export const dynamic = "force-dynamic";

export function OPTIONS(req: NextRequest) {
  return optionsWithMobileCors(req);
}

export async function GET(req: NextRequest) {
  const access = await requireEventHostPartnerAccountFromRequest(req);

  if (!access.ok || !access.partner) {
    return NextResponse.json(
      { error: access.error },
      { status: 401, headers: mobileCorsHeaders(req) },
    );
  }

  const tab = (req.nextUrl.searchParams.get("tab") || "upcoming") as PartnerEventTab;
  const events = await fetchPartnerEvents(access.partner.id, tab);

  return NextResponse.json(
    { events, partner: access.partner },
    { headers: mobileCorsHeaders(req) },
  );
}

export async function POST(req: NextRequest) {
  const access = await requireEventHostPartnerAccountFromRequest(req);

  if (!access.ok || !access.partner || !access.userId) {
    return NextResponse.json(
      { error: access.error },
      { status: 401, headers: mobileCorsHeaders(req) },
    );
  }

  const body = await req.json().catch(() => ({}));
  const result = await createPartnerEventDraftWithAccess(
    { userId: access.userId, partner: access.partner },
    body,
  );

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: 400, headers: mobileCorsHeaders(req) },
    );
  }

  return NextResponse.json(
    { event: result.event },
    { headers: mobileCorsHeaders(req) },
  );
}
