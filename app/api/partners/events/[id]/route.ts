import { NextRequest, NextResponse } from "next/server";
import { requirePartnerAccountFromRequest } from "@/lib/community/partner-access";
import {
  autosavePartnerEventWithAccess,
  cancelPartnerEventWithAccess,
  createPartnerEventSeriesWithAccess,
  deletePartnerEventDraftWithAccess,
  duplicatePartnerEventWithAccess,
  fetchPartnerEventByIdWithAccess,
  submitPartnerEventForReviewWithAccess,
} from "@/lib/community/partner-event-mutations";
import type { RecurrenceRule } from "@/lib/community/recurring";
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
  const access = await requirePartnerAccountFromRequest(req);

  if (!access.ok || !access.partner || !access.userId) {
    return NextResponse.json(
      { error: access.error },
      { status: 401, headers: mobileCorsHeaders(req) },
    );
  }

  const { id } = await context.params;
  const event = await fetchPartnerEventByIdWithAccess(
    { userId: access.userId, partner: access.partner },
    id,
  );

  if (!event) {
    return NextResponse.json(
      { error: "Event not found." },
      { status: 404, headers: mobileCorsHeaders(req) },
    );
  }

  return NextResponse.json({ event }, { headers: mobileCorsHeaders(req) });
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const access = await requirePartnerAccountFromRequest(req);

  if (!access.ok || !access.partner || !access.userId) {
    return NextResponse.json(
      { error: access.error },
      { status: 401, headers: mobileCorsHeaders(req) },
    );
  }

  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));
  const result = await autosavePartnerEventWithAccess(
    { userId: access.userId, partner: access.partner },
    id,
    body,
  );

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: 400, headers: mobileCorsHeaders(req) },
    );
  }

  return NextResponse.json(result, { headers: mobileCorsHeaders(req) });
}

export async function POST(req: NextRequest, context: RouteContext) {
  const access = await requirePartnerAccountFromRequest(req);

  if (!access.ok || !access.partner || !access.userId) {
    return NextResponse.json(
      { error: access.error },
      { status: 401, headers: mobileCorsHeaders(req) },
    );
  }

  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");
  const ctx = { userId: access.userId, partner: access.partner };

  switch (action) {
    case "submit": {
      const result = await submitPartnerEventForReviewWithAccess(ctx, id);
      return NextResponse.json(result, {
        status: result.ok ? 200 : 400,
        headers: mobileCorsHeaders(req),
      });
    }
    case "cancel": {
      const result = await cancelPartnerEventWithAccess(ctx, id);
      return NextResponse.json(result, {
        status: result.ok ? 200 : 400,
        headers: mobileCorsHeaders(req),
      });
    }
    case "duplicate": {
      const result = await duplicatePartnerEventWithAccess(ctx, id);
      return NextResponse.json(result, {
        status: result.ok ? 200 : 400,
        headers: mobileCorsHeaders(req),
      });
    }
    case "series": {
      const rule = String(body.rule || "none") as RecurrenceRule;
      const count = Number(body.count || 4);
      const result = await createPartnerEventSeriesWithAccess(ctx, id, rule, count);
      return NextResponse.json(result, {
        status: result.ok ? 200 : 400,
        headers: mobileCorsHeaders(req),
      });
    }
    default:
      return NextResponse.json(
        { error: "Unknown action." },
        { status: 400, headers: mobileCorsHeaders(req) },
      );
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const access = await requirePartnerAccountFromRequest(req);

  if (!access.ok || !access.partner || !access.userId) {
    return NextResponse.json(
      { error: access.error },
      { status: 401, headers: mobileCorsHeaders(req) },
    );
  }

  const { id } = await context.params;
  const result = await deletePartnerEventDraftWithAccess(
    { userId: access.userId, partner: access.partner },
    id,
  );

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: 400, headers: mobileCorsHeaders(req) },
    );
  }

  return NextResponse.json({ ok: true }, { headers: mobileCorsHeaders(req) });
}
