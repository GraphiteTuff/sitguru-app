import assert from "node:assert/strict";
import { test } from "node:test";
import {
  tiktokDraftUploadDestination,
  uploadApprovedVideoToTikTokDraft,
} from "./content-posting";

test("TikTok draft transfer accepts only TikTok's official HTTPS upload host", () => {
  assert.equal(
    tiktokDraftUploadDestination("https://open-upload.tiktokapis.com/video/?upload_id=test"),
    "https://open-upload.tiktokapis.com/video/?upload_id=test",
  );
  // Official TikTok Media Transfer Guide: example regional upload host.
  assert.equal(
    tiktokDraftUploadDestination("https://upload.us.tiktokapis.com/video/?upload_id=test&upload_token=opaque"),
    "https://upload.us.tiktokapis.com/video/?upload_id=test&upload_token=opaque",
  );
  assert.equal(
    tiktokDraftUploadDestination("https://upload.eu.tiktokapis.com/video/?upload_id=test&upload_token=opaque"),
    "https://upload.eu.tiktokapis.com/video/?upload_id=test&upload_token=opaque",
  );
  for (const value of [
    "http://open-upload.tiktokapis.com/video",
    "https://open-upload.tiktokapis.com.evil.example/video",
    "https://evil.example/video",
    "https://open-upload.tiktokapis.com@evil.example/video",
    "https://upload.us.tiktokapis.com.evil.example/video",
    "https://upload.us.tiktokapis.com@evil.example/video",
    "https://upload..tiktokapis.com/video",
    "https://upload.us.more.tiktokapis.com/video",
    "https://upload.us.tiktokapis.com:444/video",
    "http://upload.us.tiktokapis.com/video",
    "https://upload.us.tiktokapis.com.badexample.com/video",
  ]) {
    assert.throws(() => tiktokDraftUploadDestination(value));
  }
});

test("TikTok diagnostics include only a sanitized host, never private upload tokens", () => {
  const previous = console.warn;
  const messages: string[] = [];
  console.warn = (...args: unknown[]) => { messages.push(JSON.stringify(args)); };
  try {
    const secret = "secret-one-time-upload-capability";
    assert.throws(
      () => tiktokDraftUploadDestination(
        "https://unexpected.tiktokapis.com/video/?upload_id=test&upload_token=" + secret,
      ),
      /untrusted upload destination/,
    );
    assert.ok(messages.join(" ").includes("unexpected.tiktokapis.com"));
    assert.ok(!messages.join(" ").includes(secret));
    assert.ok(!messages.join(" ").includes("upload_token"));
  } finally {
    console.warn = previous;
  }
});

test("TikTok upload action initializes and transfers a draft, never a direct post", async () => {
  const previous = global.fetch;
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  global.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    if (calls.length === 1) {
      return new Response(
        JSON.stringify({
          data: {
            publish_id: "v_inbox_file~v2.testing",
            upload_url: "https://open-upload.tiktokapis.com/video/?upload_id=test",
          },
          error: { code: "ok" },
        }),
        { status: 200 },
      );
    }
    return new Response(null, { status: 201 });
  }) as typeof fetch;
  try {
    const result = await uploadApprovedVideoToTikTokDraft({
      accessToken: "test-only-token",
      bytes: new Uint8Array(1024),
      mime: "video/mp4",
    });
    assert.equal(result.publishId, "v_inbox_file~v2.testing");
    assert.match(calls[0].url, /\/v2\/post\/publish\/inbox\/video\/init\//);
    assert.equal((calls[0].init?.headers as Record<string, string>)["Authorization"], "Bearer test-only-token");
    assert.equal((calls[1].init?.headers as Record<string, string>)["Content-Range"], "bytes 0-1023/1024");
    assert.equal((calls[1].init?.headers as Record<string, string>)["Content-Length"], "1024");
    assert.equal(calls[1].init?.method, "PUT");
    assert.equal(calls[1].init?.redirect, "error");
  } finally {
    global.fetch = previous;
  }
});

test("TikTok draft transfer rejects an untrusted TikTok upload URL", async () => {
  const previous = global.fetch;
  let count = 0;
  global.fetch = (async () => {
    count++;
    return new Response(JSON.stringify({
      data: { publish_id: "demo", upload_url: "https://evil.example/upload" },
      error: { code: "ok" },
    }), { status: 200 });
  }) as typeof fetch;
  try {
    await assert.rejects(
      uploadApprovedVideoToTikTokDraft({
        accessToken: "test-only-token",
        bytes: new Uint8Array(1024),
        mime: "video/mp4",
      }),
      /untrusted upload destination/,
    );
    assert.equal(count, 1, "a rejected destination must not receive private bytes");
  } finally {
    global.fetch = previous;
  }
});

// Regression: TikTok's documented regional host must be allowed for uploads,
// while preserving the one-use upload query and forbidding follow-on redirects.
test("TikTok regional upload works without leaking or altering the signed upload URL", async () => {
  const previous = global.fetch;
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const url = "https://upload.us.tiktokapis.com/video/?upload_id=123&upload_token=do-not-log";
  global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({ url: String(input), init });
    if (requests.length === 1) {
      return new Response(JSON.stringify({
        data: { publish_id: "v_inbox_file~v2.us-region", upload_url: url },
        error: { code: "ok" },
      }), { status: 200 });
    }
    return new Response(null, { status: 201 });
  }) as typeof fetch;
  try {
    const result = await uploadApprovedVideoToTikTokDraft({
      accessToken: "test-token",
      bytes: new Uint8Array(12),
      mime: "video/mp4",
    });
    assert.equal(result.publishId, "v_inbox_file~v2.us-region");
    assert.equal(requests.length, 2);
    assert.equal(requests[1].url, url);
    assert.equal(requests[1].init?.redirect, "error");
    assert.equal((requests[1].init?.headers as Record<string, string>)["Content-Length"], "12");
    assert.equal((requests[1].init?.headers as Record<string, string>)["Authorization"], undefined);
  } finally {
    global.fetch = previous;
  }
});
