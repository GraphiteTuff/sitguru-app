import { NextRequest, NextResponse } from "next/server";
import { sendAmbassadorMissingInfoEmail } from "@/lib/admin/ambassador-missing-info-email";
import { supabaseAdmin } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DispatchBody = {
  ambassadorId?: string;
  token?: string;
};

/**
 * One-time dispatch for admin missing-info emails.
 * Requires a queued email_events row with matching dispatch_token.
 */
export async function POST(request: NextRequest) {
  let body: DispatchBody = {};

  try {
    body = (await request.json()) as DispatchBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const ambassadorId = String(body.ambassadorId || "").trim();
  const token = String(body.token || "").trim();

  if (!ambassadorId || !token || token.length < 24) {
    return NextResponse.json(
      { ok: false, error: "ambassadorId and token are required." },
      { status: 400 },
    );
  }

  const { data: queued, error: lookupError } = await supabaseAdmin
    .from("email_events")
    .select("id,status,metadata,email")
    .eq("event_type", "ambassador_missing_info_dispatch")
    .eq("status", "queued")
    .contains("metadata", {
      ambassador_id: ambassadorId,
      dispatch_token: token,
    })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json(
      { ok: false, error: lookupError.message },
      { status: 500 },
    );
  }

  if (!queued?.id) {
    return NextResponse.json(
      { ok: false, error: "No queued dispatch found for that token." },
      { status: 404 },
    );
  }

  const delivery = await sendAmbassadorMissingInfoEmail({ ambassadorId });

  await supabaseAdmin
    .from("email_events")
    .update({
      status: delivery.status === "sent" ? "dispatched" : delivery.status,
      provider_message_id: delivery.providerMessageId,
      metadata: {
        ...(typeof queued.metadata === "object" && queued.metadata
          ? queued.metadata
          : {}),
        ambassador_id: ambassadorId,
        dispatch_token: token,
        delivery_status: delivery.status,
        delivery_reason: delivery.reason,
        missing_fields: delivery.missingFields,
        dispatched_at: new Date().toISOString(),
      },
    })
    .eq("id", queued.id);

  if (delivery.status !== "sent") {
    return NextResponse.json(
      {
        ok: false,
        status: delivery.status,
        to: delivery.to,
        error: delivery.reason,
        missingFields: delivery.missingFields,
      },
      { status: delivery.status === "skipped" ? 409 : 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    to: delivery.to,
    providerMessageId: delivery.providerMessageId,
    missingFields: delivery.missingFields,
  });
}
