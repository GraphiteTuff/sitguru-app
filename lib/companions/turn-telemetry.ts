/**
 * Structured per-turn companion telemetry (no raw PII dumps).
 */

export type CompanionTurnTelemetry = {
  requestId: string;
  companion: string;
  intent: string | null;
  sources: string[];
  tool: string | null;
  toolOk: boolean | null;
  guardrail: string | null;
  latencyMs: number;
  failureType: string | null;
  stateFields: string[];
};

export function newCompanionRequestId() {
  return `cmp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function logCompanionTurn(event: CompanionTurnTelemetry) {
  try {
    console.info(
      "[companion-turn]",
      JSON.stringify({
        ...event,
        // Never log raw message bodies here.
      }),
    );
  } catch {
    /* ignore */
  }
}
