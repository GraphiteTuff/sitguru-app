import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  assertPlaidConfigured,
  getPlaidCountryCodes,
  getPlaidProducts,
  plaidClient,
} from "@/lib/plaid";

function getBaseUrl(request: NextRequest) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const origin = request.headers.get("origin");

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  if (origin) {
    return origin;
  }

  return request.nextUrl.origin;
}

function redirectToPlaidPage(
  request: NextRequest,
  type: "error" | "status",
  message: string,
) {
  const baseUrl = getBaseUrl(request);
  const url = new URL("/admin/financials/plaid", baseUrl);

  url.searchParams.set(type, message);

  return NextResponse.redirect(url);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response
  ) {
    return JSON.stringify(error.response.data);
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to create Plaid Link token.";
}

function getPlaidClientName() {
  return process.env.PLAID_CLIENT_NAME?.trim() || "SitGuru";
}

function getPlaidRedirectUri() {
  const redirectUri = process.env.PLAID_REDIRECT_URI?.trim();

  if (!redirectUri) {
    return undefined;
  }

  return redirectUri;
}

async function requireAdminUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      user: null,
      response: NextResponse.redirect("/admin/login"),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return {
      user: null,
      response: null,
      error: "Unable to verify admin profile.",
    };
  }

  if (profile?.role !== "admin") {
    return {
      user: null,
      response: null,
      error: "Admin access required.",
    };
  }

  return {
    user,
    response: null,
    error: null,
  };
}

function buildPlaidLaunchHtml({
  linkToken,
  baseUrl,
}: {
  linkToken: string;
  baseUrl: string;
}) {
  const safeToken = JSON.stringify(linkToken);
  const safeBaseUrl = JSON.stringify(baseUrl);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SitGuru Plaid Bank Connection</title>
  <script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"></script>
  <style>
    body {
      margin: 0;
      font-family: Inter, Arial, sans-serif;
      background: #f7f8f4;
      color: #10231b;
    }

    .wrap {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 32px;
    }

    .card {
      width: min(720px, 100%);
      border: 1px solid #d9eadf;
      background: white;
      border-radius: 32px;
      box-shadow: 0 30px 90px rgba(15, 23, 42, 0.12);
      padding: 36px;
    }

    .eyebrow {
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: #047857;
    }

    h1 {
      margin: 12px 0 0;
      font-size: clamp(36px, 7vw, 64px);
      line-height: 0.95;
      letter-spacing: -0.05em;
    }

    p {
      font-size: 15px;
      font-weight: 700;
      line-height: 1.7;
      color: #475569;
    }

    .status {
      margin-top: 20px;
      border: 1px solid #fde68a;
      background: #fffbeb;
      border-radius: 20px;
      padding: 16px;
      color: #78350f;
      font-size: 14px;
      font-weight: 800;
      white-space: pre-wrap;
    }

    .actions {
      margin-top: 24px;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    button,
    a {
      appearance: none;
      border: 0;
      border-radius: 999px;
      padding: 14px 22px;
      font-size: 14px;
      font-weight: 900;
      text-decoration: none;
      cursor: pointer;
    }

    button {
      background: #047857;
      color: white;
      box-shadow: 0 12px 30px rgba(4, 120, 87, 0.18);
    }

    a {
      border: 1px solid #d9eadf;
      color: #065f46;
      background: white;
    }
  </style>
</head>
<body>
  <main class="wrap">
    <section class="card">
      <div class="eyebrow">SitGuru Banking</div>
      <h1>Connect bank account</h1>
      <p>
        Plaid is ready to open. This launch page uses Plaid's direct browser script,
        not the React Plaid button, so it should work through ngrok.
      </p>

      <div id="status" class="status">Loading Plaid Link...</div>

      <div class="actions">
        <button id="openPlaid" type="button">Open Plaid Link</button>
        <a href="/admin/financials/plaid">Back to Banking</a>
      </div>
    </section>
  </main>

  <script>
    const statusBox = document.getElementById("status");
    const openButton = document.getElementById("openPlaid");
    const baseUrl = ${safeBaseUrl};
    const linkToken = ${safeToken};

    function setStatus(message) {
      statusBox.textContent = message;
    }

    function redirectWithMessage(type, message) {
      const url = new URL("/admin/financials/plaid", baseUrl);
      url.searchParams.set(type, message);
      window.location.href = url.toString();
    }

    async function exchangePublicToken(publicToken, metadata) {
      setStatus("Plaid connected. Exchanging public token with SitGuru...");

      const response = await fetch("/api/plaid/exchange-public-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({
          public_token: publicToken,
          metadata
        })
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to exchange Plaid public token.");
      }

      redirectWithMessage("status", "Bank account connected successfully.");
    }

    function initializePlaid() {
      if (!window.Plaid) {
        setStatus("Plaid script did not load. Refresh this page and try again.");
        return;
      }

      const handler = window.Plaid.create({
        token: linkToken,
        onLoad: function () {
          setStatus("Plaid Link loaded. Click Open Plaid Link.");
        },
        onSuccess: async function (public_token, metadata) {
          try {
            await exchangePublicToken(public_token, metadata);
          } catch (error) {
            setStatus(error?.message || "Unable to exchange Plaid public token.");
          }
        },
        onExit: function (error) {
          if (error) {
            setStatus(error.display_message || error.error_message || "Plaid Link closed with an error.");
            return;
          }

          setStatus("Plaid Link was closed.");
        },
        onEvent: function (eventName) {
          if (eventName) {
            console.log("Plaid event:", eventName);
          }
        }
      });

      openButton.addEventListener("click", function () {
        setStatus("Opening Plaid Link...");
        handler.open();
      });

      setStatus("Plaid Link is ready. Click Open Plaid Link.");
    }

    initializePlaid();
  </script>
</body>
</html>`;
}

export async function GET(request: NextRequest) {
  const adminCheck = await requireAdminUser();

  if (adminCheck.response) {
    return adminCheck.response;
  }

  if (!adminCheck.user) {
    return redirectToPlaidPage(
      request,
      "error",
      adminCheck.error || "Admin access required.",
    );
  }

  try {
    assertPlaidConfigured();

    const redirectUri = getPlaidRedirectUri();

    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: adminCheck.user.id,
      },
      client_name: getPlaidClientName(),
      products: getPlaidProducts(),
      country_codes: getPlaidCountryCodes(),
      language: "en",
      ...(redirectUri ? { redirect_uri: redirectUri } : {}),
    });

    const baseUrl = getBaseUrl(request);
    const html = buildPlaidLaunchHtml({
      linkToken: response.data.link_token,
      baseUrl,
    });

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = getErrorMessage(error);

    console.error("Plaid start route error:", message);

    return redirectToPlaidPage(
      request,
      "error",
      `Unable to start Plaid Link: ${escapeHtml(message)}`,
    );
  }
}