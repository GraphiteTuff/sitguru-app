// app/api/walk/stream/[bookingId]/route.ts
/**
 * SSE realtime walk stream — Pet Parent (and Guru) phone clients.
 * Pushes PawReportLiveEvent JSON payloads only.
 *
 * Mobile can also request a one-shot JSON snapshot:
 * GET /api/walk/stream/[bookingId]?format=json
 * with Authorization: Bearer <access_token>
 */

import { NextRequest } from "next/server";

import { resolvePawReportAccess } from "@/lib/pawreport/access";
import { getWalkEventBus } from "@/lib/pawreport/walk-event-bus";
import { buildWalkStreamSnapshot } from "@/lib/pawreport/walk-actions";
import type { PawReportLiveEvent } from "@/lib/pawreport/walk-events";
import {
  mobileCorsHeaders,
  optionsWithMobileCors,
  resolveRequestUser,
} from "@/lib/supabase/request-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ bookingId: string }>;
};

function encodeSse(event: PawReportLiveEvent) {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function OPTIONS(request: NextRequest) {
  return optionsWithMobileCors(request);
}

export async function GET(request: Request, context: RouteContext) {
  const { bookingId: raw } = await context.params;
  const bookingId = String(raw || "").trim();
  const cors = mobileCorsHeaders(request);
  const url = new URL(request.url);
  const wantsJson =
    url.searchParams.get("format") === "json" ||
    (request.headers.get("accept") || "").includes("application/json");

  if (!bookingId) {
    return new Response(JSON.stringify({ error: "Missing booking ID." }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }

  const resolved = await resolveRequestUser(request);

  if (!resolved?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }

  const user = resolved.user;

  const access = await resolvePawReportAccess({
    bookingId,
    userId: user.id,
    email: user.email,
  });

  if (!access?.canRead) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }

  if (wantsJson) {
    try {
      const snapshot = await buildWalkStreamSnapshot({ bookingId, access });
      return new Response(JSON.stringify(snapshot), {
        status: 200,
        headers: { "Content-Type": "application/json", ...cors },
      });
    } catch (error) {
      console.error("Walk JSON snapshot error:", error);
      return new Response(
        JSON.stringify({ error: "Unable to load walk snapshot." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...cors },
        },
      );
    }
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
      ...cors,
    },
  });
}
