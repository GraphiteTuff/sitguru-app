// app/api/chat/send/route.ts
/**
 * Chat send — Consumer / portal-aware Vercel AI SDK stream (Claude).
 * Persona isolation + JWT session gate run inside handleAuthenticatedAiSend
 * BEFORE any LLM provider call (403 on spoofed admin claims).
 */

import { handleAuthenticatedAiSend } from "@/lib/messaging/stream-send";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  return handleAuthenticatedAiSend(req);
}
