// app/api/notifications/subscribe/route.ts
/**
 * POST /api/notifications/subscribe
 * Saves a Pet Parent browser/service-worker PushSubscription (VAPID).
 *
 * GET  /api/notifications/subscribe
 * Returns the public VAPID key for client subscription bootstrap.
 */

import { NextResponse } from "next/server";
import {
  getWebPushPublicKey,
  isWebPushConfigured,
  savePushSubscription,
  type PushSubscriptionJSON,
} from "@/lib/services/webPush";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isWebPushConfigured()) {
    return NextResponse.json(
      { error: "Web Push is not configured.", publicKey: null },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    publicKey: getWebPushPublicKey(),
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    subscription?: PushSubscriptionJSON;
  } | null;

  if (!body?.subscription?.endpoint || !body.subscription.keys) {
    return NextResponse.json(
      { error: "Missing PushSubscription payload." },
      { status: 400 },
    );
  }

  try {
    await savePushSubscription({
      userId: user.id,
      subscription: body.subscription,
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[notifications/subscribe] failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not save push subscription.",
      },
      { status: 500 },
    );
  }
}
