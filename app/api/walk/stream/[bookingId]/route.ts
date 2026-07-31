// app/api/walk/stream/[bookingId]/route.ts
/**
 * SSE realtime walk stream — Pet Parent (and Guru) phone clients.
 * Pushes PawReportLiveEvent JSON payloads only.
 */

import { resolvePawReportAccess } from "@/lib/pawreport/access";
import { getWalkEventBus } from "@/lib/pawreport/walk-event-bus";
import { buildWalkStreamSnapshot } from "@/lib/pawreport/walk-actions";
import type { PawReportLiveEvent } from "@/lib/pawreport/walk-events";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ bookingId: string }>;
};

function encodeSse(event: PawReportLiveEvent) {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function GET(_request: Request, context: RouteContext) {
  const { bookingId: raw } = await context.params;
  const bookingId = String(raw || "").trim();

  if (!bookingId) {
    return new Response(JSON.stringify({ error: "Missing booking ID." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const access = await resolvePawReportAccess({
    bookingId,
    userId: user.id,
    email: user.email,
  });

  if (!access?.canRead) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const bus = getWalkEventBus();
  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: PawReportLiveEvent) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(encodeSse(event)));
        } catch {
          closed = true;
        }
      };

      try {
        const snapshot = await buildWalkStreamSnapshot({ bookingId, access });
        send(snapshot);
      } catch (error) {
        console.error("Walk SSE snapshot error:", error);
      }

      unsubscribe = bus.subscribe(bookingId, (event) => {
        send(event);
      });

      heartbeat = setInterval(() => {
        send({
          bookingId,
          eventType: "HEARTBEAT",
          data: { timestamp: new Date().toISOString() },
        });
      }, 15000);
    },
    cancel() {
      closed = true;
      if (heartbeat) clearInterval(heartbeat);
      if (unsubscribe) unsubscribe();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
