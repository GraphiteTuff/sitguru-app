/**
 * Localized mock integration check for /api/admin/broadcast
 *
 * Clears the live Resend key, stubs admin auth via mock tsconfig paths,
 * invokes the real POST handler, and prints a clean status + JSON body.
 */

process.env.RESEND_API_KEY = "";

const payload = {
  subject: "SitGuru System Update Check",
  message:
    "The modern Plus Jakarta Sans typography and payment grids are live!",
};

async function main() {
  const { NextRequest } = await import("next/server");
  const { POST } = await import("../app/api/admin/broadcast/route");

  const request = new NextRequest("http://127.0.0.1:3000/api/admin/broadcast", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer mock-admin-token",
    },
    body: JSON.stringify(payload),
  });

  const response = await POST(request);
  const status = response.status;
  const body = await response.json().catch(() => null);

  console.log("=== SitGuru mock broadcast check ===");
  console.log("Payload:", JSON.stringify(payload, null, 2));
  console.log("Response status:", status);
  console.log("Response body:", JSON.stringify(body, null, 2));

  if (
    status === 500 &&
    body?.error &&
    String(body.error).includes("RESEND_API_KEY")
  ) {
    console.log("Result: PASS — missing live Resend key caught safely.");
    return;
  }

  console.log("Result: FAIL — expected HTTP 500 for missing RESEND_API_KEY.");
  process.exitCode = 1;
}

main().catch((error) => {
  console.error("Mock broadcast check crashed:", error);
  process.exitCode = 1;
});
