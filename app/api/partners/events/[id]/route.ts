import { NextRequest, NextResponse } from "next/server";
import { requirePartnerAccount } from "@/lib/community/partner-access";
import {
  autosavePartnerEvent,
  cancelPartnerEvent,
  deletePartnerEventDraft,
  duplicatePartnerEvent,
  submitPartnerEventForReview,
} from "@/app/partners/dashboard/community/events/actions";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: NextRequest, context: RouteContext) {
  const access = await requirePartnerAccount();

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));
  const result = await autosavePartnerEvent(id, body);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}

export async function POST(req: NextRequest, context: RouteContext) {
  const access = await requirePartnerAccount();

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");

  switch (action) {
    case "submit":
      return NextResponse.json(await submitPartnerEventForReview(id));
    case "cancel":
      return NextResponse.json(await cancelPartnerEvent(id));
    case "duplicate":
      return NextResponse.json(await duplicatePartnerEvent(id));
    default:
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const access = await requirePartnerAccount();

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: 401 });
  }

  const { id } = await context.params;
  const result = await deletePartnerEventDraft(id);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
