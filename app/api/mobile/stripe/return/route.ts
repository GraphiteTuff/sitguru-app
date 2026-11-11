import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MOBILE_SCHEME =
  process.env.SITGURU_MOBILE_URL_SCHEME?.trim() ||
  process.env.NEXT_PUBLIC_SITGURU_MOBILE_URL_SCHEME?.trim() ||
  "sitgurumobile";

function safeQueryValue(value: string | null) {
  return (value || "").trim().slice(0, 200);
}

function buildMobileDeepLink(result: string) {
  const url = new URL(`${MOBILE_SCHEME}://guru-earnings`);
  url.searchParams.set("stripe", result || "return");
  return url;
}

export async function GET(req: NextRequest) {
  const result = safeQueryValue(
    req.nextUrl.searchParams.get("result") ||
      req.nextUrl.searchParams.get("stripe") ||
      "return",
  );

  const mobileReturnUrl = buildMobileDeepLink(result);
  const webFallbackUrl = new URL("/guru/dashboard/earnings", req.nextUrl.origin);
  webFallbackUrl.searchParams.set("stripe", result);

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#0D5C3A" />
    <title>Returning to SitGuru</title>
    <style>
      body {
        align-items: center;
        background: #f7fffb;
        color: #123f31;
        display: flex;
        font-family: "Plus Jakarta Sans", Inter, system-ui, sans-serif;
        justify-content: center;
        margin: 0;
        min-height: 100vh;
        padding: 24px;
      }
      main {
        background: #fff;
        border: 1px solid #d1fae5;
        border-radius: 28px;
        box-shadow: 0 18px 48px rgba(16, 49, 37, 0.12);
        max-width: 460px;
        padding: 28px;
        text-align: center;
        width: 100%;
      }
      h1 { font-size: 26px; margin: 0 0 10px; }
      p { color: #5e756b; font-size: 15px; line-height: 1.6; margin: 0 0 18px; }
      a {
        align-items: center;
        background: #0d5c3a;
        border-radius: 999px;
        color: #fff;
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
        border: 1px solid #0d5c3a;
        color: #0d5c3a;
        margin-top: 10px;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Returning to SitGuru</h1>
      <p>
        SitGuru is checking your secure payout setup status. This does not mean
        setup is finished yet — the app will confirm with SitGuru next.
      </p>
      <a href="${mobileReturnUrl.toString()}">Open the SitGuru app</a>
      <a class="secondary" href="${webFallbackUrl.toString()}">Continue on the website</a>
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
