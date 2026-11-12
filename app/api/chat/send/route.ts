// app/api/chat/send/route.ts
/**
 * Chat send — authenticated Vercel AI SDK stream (Claude).
 */

import { handleAuthenticatedAiSend } from "@/lib/messaging/stream-send";

export const dynamic = "force-dynamic";
// Node runtime required for companion memory, archive, and admin clients.
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  return handleAuthenticatedAiSend(req);
}
