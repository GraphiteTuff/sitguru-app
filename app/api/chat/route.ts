/**
 * Main AI chat controller — persona-isolated Rogue / Delilah entrypoint.
 *
 * Route-level session gate (Supabase JWT cookie) runs BEFORE any LLM call:
 *   - Admin Portal  → global brand social tools (verified admin only)
 *   - Ambassador    → Delilah self-scoped metrics (forced ambassadorId)
 *   - Consumer      → no social/business tools registered
 *
 * Spoofed admin flags in body/prompt from non-admins → HTTP 403.
 */

import { handleAuthenticatedAiSend } from "@/lib/messaging/stream-send";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  return handleAuthenticatedAiSend(req);
}
