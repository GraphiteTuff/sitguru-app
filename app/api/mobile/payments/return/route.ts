import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MOBILE_SCHEME =
  process.env.SITGURU_MOBILE_URL_SCHEME?.trim() ||
  process.env.NEXT_PUBLIC_SITGURU_MOBILE_URL_SCHEME?.trim() ||
  "sitgurumobile";

type CheckoutResult = "complete" | "cancelled";

function normalizeCheckoutResult(value: string | null): CheckoutResult {
  const normalized = (value || "").trim().toLowerCase();

  if (
    normalized === "cancel" ||
    normalized === "canceled" ||
    normalized === "cancelled"
  ) {
    return "cancelled";
  }

  return "complete";
}

function safeQueryValue(value: string | null) {
  return (value || "").trim().slice(0, 500);
}

function buildMobileReturnUrl({
  result,
  bookingId,
  sessionId,
}: {
  result: CheckoutResult;
  bookingId: string;
  sessionId: string;
}) {
  const url = new URL(`${MOBILE_SCHEME}://payments`);

  url.searchParams.set("checkout", result);

  if (bookingId) {
    url.searchParams.set("bookingId", bookingId);
  }

  if (sessionId) {
    url.searchParams.set("sessionId", sessionId);
  }

  return url;
}

function buildWebFallbackUrl({
  req,
  result,
  bookingId,
  sessionId,
}: {
  req: NextRequest;
  result: CheckoutResult;
  bookingId: string;
  sessionId: string;
}) {
  const fallbackPath =
    result === "cancelled" ? "/bookings/cancel" : "/bookings/success";

  const fallbackUrl = new URL(fallbackPath, req.nextUrl.origin);

  if (bookingId) {
    fallbackUrl.searchParams.set("bookingId", bookingId);
  }

  if (sessionId) {
    fallbackUrl.searchParams.set("session_id", sessionId);
  }

  return fallbackUrl;
}

export async function GET(req: NextRequest) {
  const result = normalizeCheckoutResult(
    req.nextUrl.searchParams.get("result") ||
      req.nextUrl.searchParams.get("checkout") ||
      req.nextUrl.searchParams.get("status"),
  );

  const bookingId = safeQueryValue(
    req.nextUrl.searchParams.get("bookingId") ||
      req.nextUrl.searchParams.get("booking_id"),
  );

  const sessionId = safeQueryValue(
    req.nextUrl.searchParams.get("session_id") ||
      req.nextUrl.searchParams.get("sessionId"),
  );

  const mobileReturnUrl = buildMobileReturnUrl({
    result,
    bookingId,
    sessionId,
  });

  const webFallbackUrl = buildWebFallbackUrl({
    req,
    result,
    bookingId,
    sessionId,
  });

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, viewport-fit=cover"
    />
    <meta name="theme-color" content="#0E8F5B" />
    <title>Returning to SitGuru</title>
    <style>
      :root {
        color-scheme: light dark;
        font-family:
          "Plus Jakarta Sans",
          Inter,
          ui-sans-serif,
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
      }

      * {
        box-sizing: border-box;
      }

      body {
        align-items: center;
        background: #fff9f1;
        color: #123f31;
        display: flex;
        justify-content: center;
        margin: 0;
        min-height: 100vh;
        padding: 24px;
      }

      main {
        background: #fffefa;
        border: 1px solid #eaddcb;
        border-radius: 28px;
        box-shadow: 0 18px 48px rgba(16, 49, 37, 0.12);
        max-width: 460px;
        padding: 28px;
        text-align: center;
        width: 100%;
      }

      .mark {
        align-items: center;
        background: #0e8f5b;
        border-radius: 18px;
        color: #ffffff;
        display: inline-flex;
        font-size: 26px;
        height: 58px;
        justify-content: center;
        margin-bottom: 16px;
        width: 58px;
      }

      h1 {
        font-size: 27px;
        letter-spacing: -0.7px;
        line-height: 1.15;
        margin: 0 0 10px;
      }

      p {
        color: #5e756b;
        font-size: 15px;
        line-height: 1.6;
        margin: 0 0 18px;
      }

      a {
        align-items: center;
        background: #0e8f5b;
        border-radius: 999px;
        color: #ffffff;
        display: inline-flex;
        font-size: 14px;
        font-weight: 800;
        justify-content: center;
        min-height: 50px;
        padding: 0 22px;
        text-decoration: none;
        width: 100%;
      }

      .secondary {
        background: transparent;
        border: 1px solid #0e8f5b;
        color: #0e8f5b;
        margin-top: 10px;
      }

      @media (prefers-color-scheme: dark) {
        body {
          background: #06140f;
          color: #fff5e8;
        }

        main {
          background: #0b2118;
          border-color: #234b38;
        }

        p {
          color: #9db0a5;
        }

        .secondary {
          color: #39d982;
          border-color: #39d982;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <div class="mark">✓</div>
      <h1>Returning to SitGuru</h1>
      <p>
        ${
          result === "cancelled"
            ? "Checkout was closed. No payment has been confirmed."
            : "SitGuru is checking the final payment status before showing the booking as paid."
        }
      </p>
      <a href="${mobileReturnUrl.toString()}">Open the SitGuru app</a>
      <a class="secondary" href="${webFallbackUrl.toString()}">
        Continue on the SitGuru website
      </a>
    </main>

    <script>
      window.setTimeout(function () {
        window.location.href = ${JSON.stringify(mobileReturnUrl.toString())};
      }, 150);
    </script>
  </body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Type": "text/html; charset=utf-8",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
    },
  });
}