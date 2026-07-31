// app/api/messaging/send/route.ts
/**
 * Messaging send — authenticated Vercel AI SDK stream (Claude).
 */

import { handleAuthenticatedAiSend } from "@/lib/messaging/stream-send";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export async function POST(req: Request) {
  return handleAuthenticatedAiSend(req);
}
