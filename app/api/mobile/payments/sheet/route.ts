import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ALLOWED_LOCAL_ORIGINS = new Set([
  "http://localhost:8081",
  "http://localhost:8082",
  "http://127.0.0.1:8081",
  "http://127.0.0.1:8082",
]);

function normalizeOrigin(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function getConfiguredAllowedOrigins() {
  const values = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITGURU_WEB_URL,
  ];

  return new Set(
    values
      .map((value) => (value ? normalizeOrigin(value) : ""))
      .filter(Boolean),
  );
}

function isAllowedOrigin(origin: string) {
  const normalized = normalizeOrigin(origin);

  if (ALLOWED_LOCAL_ORIGINS.has(normalized)) {
    return true;
  }

  if (getConfiguredAllowedOrigins().has(normalized)) {
    return true;
  }

  try {
    const url = new URL(normalized);
    return (
      url.hostname === "sitguru.com" ||
      url.hostname.endsWith(".sitguru.com")
    );
  } catch {
    return false;
  }
}

function corsHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {
    Vary: "Origin",
  };

  const origin = req.headers.get("origin") || "";

  if (!origin || !isAllowedOrigin(origin)) {
    return headers;
  }

  headers["Access-Control-Allow-Credentials"] = "true";
  headers["Access-Control-Allow-Headers"] =
    "Authorization, Content-Type, X-Requested-With";
  headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
  headers["Access-Control-Allow-Origin"] = origin;

  return headers;
}

function jsonError(req: NextRequest, message: string, status: number) {
  return NextResponse.json(
    { success: false, error: message },
    { status, headers: corsHeaders(req) },
  );
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req),
  });
}

export async function POST(req: NextRequest) {
  try {
    const requestBody = await req.text();
    if (!requestBody.trim()) {
      return jsonError(req, "Missing payment sheet request body.", 400);
    }

    let parsedBody: Record<string, unknown>;
    try {
      parsedBody = JSON.parse(requestBody) as Record<string, unknown>;
    } catch {
      return jsonError(req, "Payment sheet body must be valid JSON.", 400);
    }

    const checkoutUrl = new URL("/api/stripe/checkout", req.nextUrl.origin);
    const authorization = req.headers.get("authorization") || "";
    const cookie = req.headers.get("cookie") || "";
    const origin = req.headers.get("origin") || "";

    const forwardedResponse = await fetch(checkoutUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authorization ? { Authorization: authorization } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        ...(origin ? { Origin: origin } : {}),
        "X-SitGuru-Checkout-Client": "mobile-payment-sheet",
      },
      body: JSON.stringify({
        ...parsedBody,
        paymentSheet: true,
        uiMode: "payment_sheet",
        checkoutMode: "payment_sheet",
        client: "sitguru-mobile",
        platform:
          typeof parsedBody.platform === "string"
            ? parsedBody.platform
            : "mobile",
      }),
      cache: "no-store",
    });

    const responseText = await forwardedResponse.text();

    return new NextResponse(responseText, {
      status: forwardedResponse.status,
      headers: {
        ...corsHeaders(req),
        "Cache-Control": "no-store, max-age=0",
        "Content-Type":
          forwardedResponse.headers.get("content-type") ||
          "application/json; charset=utf-8",
      },
    });
  } catch (error) {
    return jsonError(
      req,
      error instanceof Error
        ? error.message
        : "SitGuru Payment Sheet could not be started.",
      500,
    );
  }
}
