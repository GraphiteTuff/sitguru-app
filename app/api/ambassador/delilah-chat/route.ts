/**
 * Delilah ambassador chat — ambassador-portal persona surface.
 * Requires an active ambassador Supabase session; metrics are self-scoped.
 */

import { handleAuthenticatedAiSend } from "@/lib/messaging/stream-send";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  // Clone is unnecessary — stream-send reads JSON once. Surface is inferred
  // from this URL path (/api/ambassador/...) inside evaluatePersonaRouteGate.
  return handleAuthenticatedAiSend(req);
}
