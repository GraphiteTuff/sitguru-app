import assert from "node:assert/strict";
import { test } from "node:test";
import {
  describeTikTokDraftDelivery,
  deliveryStateFromAudit,
  extractTikTokDraftPublishId,
  fetchTikTokDraftDeliveryStatus,
} from "./content-posting-status";

const ID = "v_inbox_file~v2.1234567890123";

test("TikTok status checker extracts the exact server-side audit ID and rejects malformed IDs", () => {
  const event = "Sent approved video to TikTok inbox as a draft (transfer ID: " + ID + "). Final editing and publication happen in TikTok.";
  assert.equal(extractTikTokDraftPublishId(event), ID);
  assert.equal(extractTikTokDraftPublishId("transfer ID: malicious"), null);
  assert.equal(extractTikTokDraftPublishId("(transfer ID: https://untrusted.example/video)"), null);
  assert.equal(deliveryStateFromAudit("TikTok delivery check: SEND_TO_USER_INBOX."), "SEND_TO_USER_INBOX");
  assert.equal(deliveryStateFromAudit("TikTok delivery check: FAILED. Reason: spam_risk"), "FAILED");
  assert.equal(deliveryStateFromAudit("TikTok delivery check: SOMETHING_ELSE."), null);
});

test("TikTok delivery fetch is a read-only status request, not another upload or publish", async () => {
  const previous = global.fetch;
  let count = 0;
  global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    count++;
    assert.equal(String(input), "https://open.tiktokapis.com/v2/post/publish/status/fetch/");
    assert.equal(init?.method, "POST");
    assert.equal(init?.redirect, "error");
    assert.equal((new Headers(init?.headers)).get("authorization"), "Bearer test-only-access");
    assert.deepEqual(JSON.parse(String(init?.body)), { publish_id: ID });
    return new Response(JSON.stringify({
      data: { status: "SEND_TO_USER_INBOX", uploaded_bytes: 1234 },
      error: { code: "ok", log_id: "not-for-client" },
    }), { status: 200 });
  }) as typeof fetch;
  try {
    const result = await fetchTikTokDraftDeliveryStatus("test-only-access", ID);
    assert.deepEqual(result, { status: "SEND_TO_USER_INBOX", failReason: null, uploadedBytes: 1234 });
    assert.match(describeTikTokDraftDelivery(result).message, /inbox notification was sent/);
    assert.equal(count, 1);
  } finally {
    global.fetch = previous;
  }
});

test("TikTok processing and failed states give correct guidance without auto-resending", async () => {
  const previous = global.fetch;
  let responseStatus: "PROCESSING_UPLOAD" | "FAILED" = "PROCESSING_UPLOAD";
  global.fetch = (async () => new Response(JSON.stringify({
    data: { status: responseStatus, fail_reason: responseStatus === "FAILED" ? "spam_risk_too_many_pending_share" : null },
    error: { code: "ok" },
  }), { status: 200 })) as typeof fetch;
  try {
    let state = await fetchTikTokDraftDeliveryStatus("test-only-access", ID);
    assert.equal(state.status, "PROCESSING_UPLOAD");
    assert.match(describeTikTokDraftDelivery(state).message, /Do not send the video again/);
    responseStatus = "FAILED";
    state = await fetchTikTokDraftDeliveryStatus("test-only-access", ID);
    assert.equal(state.status, "FAILED");
    assert.equal(state.failReason, "spam_risk_too_many_pending_share");
    assert.equal(describeTikTokDraftDelivery(state).kind, "error");
  } finally {
    global.fetch = previous;
  }
});

test("TikTok status checker rejects untrusted/unknown status bodies and invalid IDs", async () => {
  const previous = global.fetch;
  let count = 0;
  global.fetch = (async () => {
    count++;
    return new Response(JSON.stringify({ data: { status: "SOME_UNKNOWN_STATUS" }, error: { code: "ok" } }), { status: 200 });
  }) as typeof fetch;
  try {
    await assert.rejects(fetchTikTokDraftDeliveryStatus("test-only-access", ID), /unrecognized draft-delivery/);
    await assert.rejects(fetchTikTokDraftDeliveryStatus("test-only-access", "other_id"), /identifier or account authorization/);
    assert.equal(count, 1);
  } finally {
    global.fetch = previous;
  }
});
