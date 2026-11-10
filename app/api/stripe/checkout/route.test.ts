import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";

test("checkout route loads without a Stripe key and validates requests without outbound I/O", async (t) => {
  const previous = process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_SECRET_KEY;
  t.after(() => { if (previous === undefined) delete process.env.STRIPE_SECRET_KEY; else process.env.STRIPE_SECRET_KEY = previous; });
  let outbound = 0;
  t.mock.method(globalThis, "fetch", async () => { outbound += 1; throw new Error("External I/O forbidden in this test"); });
  const { OPTIONS, POST } = await import("./route");
  const preflight = await OPTIONS(new NextRequest("http://localhost/api/stripe/checkout", { method: "OPTIONS" }));
  assert.equal(preflight.status, 204);
  const validation = await POST(new NextRequest("http://localhost/api/stripe/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }));
  assert.equal(validation.status, 400);
  assert.equal((await validation.json()).error, "Missing bookingId");
  assert.equal(outbound, 0);
});
