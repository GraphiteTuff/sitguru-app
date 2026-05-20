import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  assertPlaidConfigured,
  getPlaidCountryCodes,
  plaidClient,
} from "@/lib/plaid";

type PlaidItemRow = {
  item_id: string;
  access_token: string;
  institution_name?: string | null;
  plaid_environment?: string | null;
  created_at?: string | null;
};

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

  return "Unable to create Plaid update mode token.";
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

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    return {
      user: null,
      response: NextResponse.redirect("/admin/login"),
    };
  }

  return {
    user,
    response: null,
  };
}

async function getNewestPlaidItem(userId: string) {
  const plaidEnvironment = process.env.PLAID_ENV || "production";

  const { data, error } = await supabaseAdmin
    .from("admin_plaid_items")
    .select("item_id, access_token, institution_name, plaid_environment, created_at")
    .eq("user_id", userId)
    .eq("plaid_environment", plaidEnvironment)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load Plaid item: ${error.message}`);
  }

  return data as PlaidItemRow | null;
}

function buildUpdateModeHtml({
  linkToken,
  baseUrl,
  receivedRedirectUri,
}: {
  linkToken: string;
  baseUrl: string;
  receivedRedirectUri: string | null;
}) {
  const safeToken = JSON.stringify(linkToken);
  const safeBaseUrl = JSON.stringify(baseUrl);
  const safeReceivedRedirectUri = JSON.stringify(receivedRedirectUri);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SitGuru Plaid Update Mode</title>
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
      width: min(760px, 100%);
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
      font-size: clamp(34px, 7vw, 60px);
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
      <h1>Authorize transactions</h1>
      <p>
        This secure Plaid update flow refreshes the existing NFCU connection and asks
        for permission to access Business Checking and Business Savings transactions.
      </p>

      <div id="status" class="status">Loading Plaid update mode...</div>

      <div class="actions">
        <button id="openPlaid" type="button">Authorize Transactions</button>
        <a href="/admin/financials/plaid">Back to Banking</a>
      </div>
    </section>
  </main>

  <script>
    const statusBox = document.getElementById("status");
    const openButton = document.getElementById("openPlaid");
    const baseUrl = ${safeBaseUrl};
    const linkToken = ${safeToken};
    const receivedRedirectUri = ${safeReceivedRedirectUri};

    function setStatus(message) {
      statusBox.textContent = message;
    }

    function redirectWithMessage(type, message) {
      const url = new URL("/admin/financials/plaid", baseUrl);
      url.searchParams.set(type, message);
      window.location.href = url.toString();
    }

    function initializePlaid() {
      if (!window.Plaid) {
        setStatus("Plaid script did not load. Refresh this page and try again.");
        return;
      }

      const plaidConfig = {
        token: linkToken,
        onLoad: function () {
          setStatus("Plaid update mode is ready. Click Authorize Transactions.");
        },
        onSuccess: function () {
          redirectWithMessage(
            "status",
            "Plaid transaction consent updated. Run Sync Transactions again."
          );
        },
        onExit: function (error) {
          if (error) {
            setStatus(error.display_message || error.error_message || "Plaid update mode closed with an error.");
            return;
          }

          setStatus("Plaid update mode was closed.");
        }
      };

      if (receivedRedirectUri) {
        plaidConfig.receivedRedirectUri = receivedRedirectUri;
      }

      const handler = window.Plaid.create(plaidConfig);

      openButton.addEventListener("click", function () {
        setStatus("Opening Plaid update mode...");
        handler.open();
      });

      if (receivedRedirectUri) {
        setStatus("Plaid OAuth return detected. Opening update mode...");
        handler.open();
      }
    }

    initializePlaid();
  </script>
</body>
</html>`;
}

export async function GET(request: NextRequest) {
  const adminCheck = await requireAdminUser();

  if (adminCheck.response || !adminCheck.user) {
    return adminCheck.response;
  }

  try {
    assertPlaidConfigured();

    const item = await getNewestPlaidItem(adminCheck.user.id);

    if (!item?.access_token) {
      const url = new URL("/admin/financials/plaid", getBaseUrl(request));
      url.searchParams.set(
        "error",
        "No active Plaid item found. Connect NFCU again first.",
      );
      return NextResponse.redirect(url);
    }

    const redirectUri = getPlaidRedirectUri();
    const receivedRedirectUri =
      request.nextUrl.searchParams.get("received_redirect_uri");

    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: adminCheck.user.id,
      },
      client_name: getPlaidClientName(),
      country_codes: getPlaidCountryCodes(),
      language: "en",
      access_token: item.access_token,
      products: ["transactions"],
      ...(redirectUri ? { redirect_uri: redirectUri } : {}),
    });

    const html = buildUpdateModeHtml({
      linkToken: response.data.link_token,
      baseUrl: getBaseUrl(request),
      receivedRedirectUri,
    });

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const url = new URL("/admin/financials/plaid", getBaseUrl(request));
    url.searchParams.set(
      "error",
      `Unable to start Plaid update mode: ${getErrorMessage(error)}`,
    );

    return NextResponse.redirect(url);
  }
}