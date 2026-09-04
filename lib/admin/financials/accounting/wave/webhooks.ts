/**
 * Wave webhooks are documented and require Wave Pro.
 * SitGuru Tax Center records webhook receipts here later.
 * Do not post financial writes from this route until read-only OAuth is verified.
 */

export const WAVE_WEBHOOK_EVENTS = [
  "account.changed",
  "transaction.changed",
  "business.changed",
] as const;

export type WaveWebhookEnvelope = {
  id?: string;
  type?: string;
  businessId?: string;
};

export function isRecognizedWaveWebhook(type: string) {
  return WAVE_WEBHOOK_EVENTS.includes(type as (typeof WAVE_WEBHOOK_EVENTS)[number]);
}

export function describeWaveWebhookPlan() {
  return "Wave webhooks can keep books current without pressing Sync. SitGuru will enable them after read-only Wave OAuth is verified. Wave Pro is required.";
}
