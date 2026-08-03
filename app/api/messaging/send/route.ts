// app/api/messaging/send/route.ts
/**
 * Messaging send — portal-aware Vercel AI SDK stream (Claude).
 * Shares the same persona route gate as /api/chat (JWT session RBAC).
 */

import { handleAuthenticatedAiSend } from "@/lib/messaging/stream-send";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  return handleAuthenticatedAiSend(req);
}
