import { NextRequest, NextResponse } from "next/server";
import { ensureCommunityEventConversation } from "@/lib/messaging/ensure-event-conversation";
import {
  mobileCorsHeaders,
  optionsWithMobileCors,
  resolveRequestUser,
} from "@/lib/supabase/request-auth";

export const dynamic = "force-dynamic";

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function OPTIONS(req: NextRequest) {
  return optionsWithMobileCors(req);
}

export async function POST(req: NextRequest) {
  const cors = mobileCorsHeaders(req);

  try {
    const resolved = await resolveRequestUser(req);
    const user = resolved?.user ?? null;

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401, headers: cors },
      );
    }

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const eventId = safeString(body?.eventId || body?.event_id);

    if (!eventId) {
      return NextResponse.json(
        { ok: false, error: "eventId is required" },
        { status: 400, headers: cors },
      );
    }

    const result = await ensureCommunityEventConversation({
      eventId,
      initiatedByUserId: user.id,
      initiatedByRole: safeString(body?.role) as never,
      opener: safeString(body?.opener) || undefined,
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: result.error.includes("access") ? 403 : 400, headers: cors },
      );
    }

    return NextResponse.json(result, { headers: cors });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ensure event conversation failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500, headers: cors });
  }
}
